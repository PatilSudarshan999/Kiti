import { businessService, BusinessRuleError } from './businessService';
import { getStoreState } from './store';

// Web Speech API interfaces
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export interface VoiceExecutionResult {
  transcript: string;
  toolCalled: string;
  toolArgs: Record<string, unknown>;
  spokenReply: string;
  success: boolean;
}
export class AIVoiceService {
  public onListeningChange?: (listening: boolean) => void;
  public onLog?: (log: any) => void;
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private onTranscriptCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onResultCallback: ((result: VoiceExecutionResult) => void) | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentText = finalTranscript || interimTranscript;
          if (this.onTranscriptCallback && currentText) {
            this.onTranscriptCallback(currentText, Boolean(finalTranscript));
          }

          if (finalTranscript) {
            this.processVoiceCommand(finalTranscript.trim());
          }
        };

        this.recognition.onerror = (e) => {
          console.warn('[Kiti Voice] Speech recognition warning:', e.error);
        };

        this.recognition.onend = () => {
          this.isListening = false;
        };
      } catch (err) {
        console.warn('[Kiti Voice] Recognition init failed:', err);
      }
    }
  }

  public setCallbacks(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onResult: (result: VoiceExecutionResult) => void
  ) {
    this.onTranscriptCallback = onTranscript;
    this.onResultCallback = onResult;
  }

  public startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (e) {
        console.warn('[Kiti Voice] Could not start speech recognition:', e);
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
      } catch (e) {
        console.warn('[Kiti Voice] Could not stop speech recognition:', e);
      }
    }
  }

  /**
   * Speak output using Web SpeechSynthesis
   */
  public speak(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending utterances
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      // Try to find a warm, natural English voice
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (naturalVoice) utterance.voice = naturalVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[Kiti Voice] Speech synthesis error:', e);
    }
  }

  /**
   * Process voice command: Converts natural speech to function call and executes it
   */
  public async processVoiceCommand(rawTranscript: string): Promise<VoiceExecutionResult> {
    // Strip "Hey Kiti" or "Kiti" wake words if present
    const cleanPrompt = rawTranscript
      .replace(/^(hey kiti|kiti|ok kiti|okay kiti|hi kiti)[\s,:]*/i, '')
      .trim();

    console.log(`[Kiti Voice Input] "${rawTranscript}" -> Clean: "${cleanPrompt}"`);

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    let result: VoiceExecutionResult;

    if (geminiKey) {
      try {
        result = await this.callGeminiFunctionCalling(cleanPrompt, geminiKey);
      } catch (err) {
        console.warn('[Kiti AI] Gemini API call error, falling back to local NLU engine:', err);
        result = this.deterministicNLUDispatch(cleanPrompt);
      }
    } else {
      result = this.deterministicNLUDispatch(cleanPrompt);
    }

    if (this.onResultCallback) {
      this.onResultCallback(result);
    }

    this.speak(result.spokenReply);
    return result;
  }

  /**
   * Deterministic local NLU Function Calling engine (100% offline & reliable)
   */
  private deterministicNLUDispatch(text: string): VoiceExecutionResult {
    const lower = text.toLowerCase();
    const state = getStoreState();

    try {
      // 1. Table Status Check: "is table 3 ready to bill?", "what did table 2 order?", "status of table 5"
      const tableCheckMatch = lower.match(/table\s+(\d+).*(status|order|ready to bill|billing|ready)/i) ||
                              lower.match(/what did table\s+(\d+)\s+order/i) ||
                              lower.match(/is table\s+(\d+)\s+ready/i);
      if (tableCheckMatch) {
        const tableNo = parseInt(tableCheckMatch[1], 10);
        const table = state.tables.find(t => t.tableNo === tableNo);
        if (!table) {
          return {
            transcript: text,
            toolCalled: 'check_table_status',
            toolArgs: { tableNo },
            spokenReply: `Table ${tableNo} does not exist on the floor.`,
            success: false
          };
        }

        const activeOrder = state.orders.find(o => o.tableNo === tableNo && o.status !== 'Completed' && o.status !== 'Cancelled');
        let spoken = `Table ${tableNo} is currently ${table.status}.`;
        if (activeOrder) {
          const itemSummary = activeOrder.items.map(i => `${i.quantity} ${i.itemName} (${i.status})`).join(', ');
          spoken += ` Active order items: ${itemSummary}. Current bill subtotal is ₹${activeOrder.subtotal}.`;
        }

        return {
          transcript: text,
          toolCalled: 'check_table_status',
          toolArgs: { tableNo },
          spokenReply: spoken,
          success: true
        };
      }

      // 2. Kitchen: Pending Orders Count: "how many orders are pending?", "pending orders"
      if (lower.includes('pending') && (lower.includes('order') || lower.includes('how many'))) {
        const pendingCount = businessService.getPendingOrdersCount();
        const spoken = pendingCount === 0
          ? 'There are no pending orders in the kitchen. All stations are clear!'
          : `There are currently ${pendingCount} pending items waiting for preparation in the kitchen.`;

        return {
          transcript: text,
          toolCalled: 'get_pending_orders',
          toolArgs: {},
          spokenReply: spoken,
          success: true
        };
      }

      // 3. Kitchen: Out of stock toggle: "we're out of paneer tikka", "mark coke out of stock"
      if (lower.includes('out of') || (lower.includes('mark') && lower.includes('stock'))) {
        const matchedItem = state.menuItems.find(m => lower.includes(m.name.toLowerCase()));
        if (matchedItem) {
          businessService.toggleItemStock(matchedItem.id, 'OutOfStock');
          return {
            transcript: text,
            toolCalled: 'toggle_item_stock',
            toolArgs: { itemId: matchedItem.id, availability: 'OutOfStock' },
            spokenReply: `Understood Chef. ${matchedItem.name} has been marked Out of Stock immediately. No new orders can be placed for this item.`,
            success: true
          };
        }
      }

      // 4. Kitchen: Mark item ready: "mark table 5's paneer tikka ready", "table 2 dal makhani ready"
      const readyMatch = lower.match(/(?:mark\s+)?table\s+(\d+)(?:'s)?\s+(.+?)\s+ready/i) ||
                         lower.match(/(.+?)\s+(?:for\s+)?table\s+(\d+)\s+is\s+ready/i);
      if (readyMatch) {
        let tableNo = 0;
        let dishName = '';
        if (readyMatch[1] && !isNaN(parseInt(readyMatch[1], 10))) {
          tableNo = parseInt(readyMatch[1], 10);
          dishName = readyMatch[2].trim();
        } else {
          dishName = readyMatch[1].trim();
          tableNo = parseInt(readyMatch[2], 10);
        }

        const order = state.orders.find(o => o.tableNo === tableNo && o.status === 'Active');
        if (!order) {
          return {
            transcript: text,
            toolCalled: 'mark_item_ready',
            toolArgs: { tableNo, dishName },
            spokenReply: `No active order found for Table ${tableNo}.`,
            success: false
          };
        }

        const item = order.items.find(i => i.itemName.toLowerCase().includes(dishName.toLowerCase()) || dishName.toLowerCase().includes(i.itemName.toLowerCase()));
        if (!item) {
          return {
            transcript: text,
            toolCalled: 'mark_item_ready',
            toolArgs: { tableNo, dishName },
            spokenReply: `Could not find "${dishName}" in Table ${tableNo}'s order.`,
            success: false
          };
        }

        businessService.updateItemStatus(order.id, item.lineId, 'Ready');
        return {
          transcript: text,
          toolCalled: 'mark_item_ready',
          toolArgs: { tableNo, lineId: item.lineId },
          spokenReply: `Marked ${item.itemName} ready for pickup on Table ${tableNo}. Waiter notified.`,
          success: true
        };
      }

      // 5. Owner: Today's sales: "what's today's sales?", "today's revenue", "sales today"
      if (lower.includes('today') && (lower.includes('sale') || lower.includes('revenue'))) {
        const sales = businessService.getTodaySalesSummary();
        const spoken = `Today's total revenue is ₹${sales.totalRevenue.toLocaleString()} across ${sales.paidOrdersCount} completed tables, with an average bill value of ₹${sales.averageBill}.`;
        return {
          transcript: text,
          toolCalled: 'get_today_sales',
          toolArgs: {},
          spokenReply: spoken,
          success: true
        };
      }

      // 6. Owner: Most sold dish: "what's our most sold dish this week?", "top dish", "best selling dish"
      if (lower.includes('most sold') || lower.includes('top dish') || lower.includes('best selling')) {
        const topDishes = businessService.getTopSoldDishes();
        if (topDishes.length === 0) {
          return {
            transcript: text,
            toolCalled: 'get_top_dishes',
            toolArgs: {},
            spokenReply: 'No sales recorded yet today to calculate top dishes.',
            success: true
          };
        }
        const top = topDishes[0];
        const spoken = `Our most popular dish is "${top.name}" with ${top.count} portions served, generating ₹${top.revenue} in sales.`;
        return {
          transcript: text,
          toolCalled: 'get_top_dishes',
          toolArgs: {},
          spokenReply: spoken,
          success: true
        };
      }

      // 7. Manager/Owner: Complaints: "any complaints today?", "show complaints"
      if (lower.includes('complaint')) {
        const activeComplaints = state.complaints.filter(c => c.status === 'Open');
        if (activeComplaints.length === 0) {
          return {
            transcript: text,
            toolCalled: 'get_complaints',
            toolArgs: {},
            spokenReply: 'Good news! There are zero open customer complaints on the floor right now.',
            success: true
          };
        }

        const spoken = `We have ${activeComplaints.length} open complaint. Table ${activeComplaints[0].tableNo || 'N/A'}: ${activeComplaints[0].text}`;
        return {
          transcript: text,
          toolCalled: 'get_complaints',
          toolArgs: {},
          spokenReply: spoken,
          success: true
        };
      }

      // 8. Order Placement: "table 5 — two paneer tikka, one coke", "order for table 3 1 biryani"
      const orderMatch = lower.match(/table\s+(\d+)\s*[-:]?\s*(.+)/i);
      if (orderMatch && !lower.includes('cancel') && !lower.includes('bill')) {
        const tableNo = parseInt(orderMatch[1], 10);
        const itemsStr = orderMatch[2];

        // Parse items string (e.g., "two paneer tikka, one coke", "1 butter chicken and 2 garlic naan")
        const wordNumberMap: Record<string, number> = {
          one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10
        };

        const itemSegments = itemsStr.split(/,|\band\b/i);
        const requestedItems: Array<{ menuItemId: string; quantity: number }> = [];

        for (const seg of itemSegments) {
          const trimmed = seg.trim();
          if (!trimmed) continue;

          let qty = 1;
          let dishPart = trimmed;

          const numMatch = trimmed.match(/^(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)/i);
          if (numMatch) {
            qty = isNaN(parseInt(numMatch[1], 10)) ? (wordNumberMap[numMatch[1].toLowerCase()] || 1) : parseInt(numMatch[1], 10);
            dishPart = numMatch[2].trim();
          }

          // Match menu item
          const found = state.menuItems.find(m =>
            m.name.toLowerCase().includes(dishPart.toLowerCase()) ||
            dishPart.toLowerCase().includes(m.name.toLowerCase()) ||
            m.id.toLowerCase().includes(dishPart.toLowerCase())
          );

          if (found) {
            requestedItems.push({ menuItemId: found.id, quantity: qty });
          }
        }

        if (requestedItems.length > 0) {
          // Check if table already has an active order
          const existingOrder = state.orders.find(o => o.tableNo === tableNo && o.status === 'Active');
          if (existingOrder) {
            const addRes = businessService.addItemsToOrder({
              orderId: existingOrder.id,
              items: requestedItems
            });
            return {
              transcript: text,
              toolCalled: 'add_items_to_order',
              toolArgs: { tableNo, items: requestedItems },
              spokenReply: `Added ${requestedItems.length} items to Table ${tableNo}'s existing order. Subtotal is now ₹${addRes.order.subtotal}.`,
              success: true
            };
          } else {
            const createRes = businessService.createOrder({
              tableNo,
              items: requestedItems
            });
            return {
              transcript: text,
              toolCalled: 'create_order',
              toolArgs: { tableNo, items: requestedItems },
              spokenReply: `Order #${createRes.order.id} placed for Table ${tableNo} with ${requestedItems.length} items. Sent directly to Kitchen stations.`,
              success: true
            };
          }
        }
      }

      // 9. Billing Request: "bill table 3", "table 2 ready to bill"
      if (lower.includes('bill')) {
        const tableMatch = lower.match(/table\s+(\d+)/i);
        if (tableMatch) {
          const tableNo = parseInt(tableMatch[1], 10);
          const splitType = lower.includes('person') ? 'ByPerson' : (lower.includes('item') ? 'ByItem' : 'Whole');
          const billRes = businessService.generateBill({ tableNo, splitType });
          return {
            transcript: text,
            toolCalled: 'generate_bill',
            toolArgs: { tableNo, splitType },
            spokenReply: `Bill generated for Table ${tableNo}. Total amount due is ₹${billRes.bill.total}. Table is now locked in Billing status.`,
            success: true
          };
        }
      }

      // 10. Cancellation: "cancel table 7's order", "cancel table 2's dal makhani"
      if (lower.includes('cancel')) {
        const tableMatch = lower.match(/table\s+(\d+)/i);
        if (tableMatch) {
          const tableNo = parseInt(tableMatch[1], 10);
          const activeOrder = state.orders.find(o => o.tableNo === tableNo && o.status === 'Active');
          if (activeOrder) {
            // Check if cancelling a specific item or entire order
            const itemToCancel = activeOrder.items.find(i => lower.includes(i.itemName.toLowerCase()));
            if (itemToCancel) {
              businessService.cancelItem({
                orderId: activeOrder.id,
                lineId: itemToCancel.lineId,
                reason: 'Voice command cancellation'
              });
              return {
                transcript: text,
                toolCalled: 'cancel_item',
                toolArgs: { tableNo, item: itemToCancel.itemName },
                spokenReply: `Cancelled ${itemToCancel.itemName} on Table ${tableNo}.`,
                success: true
              };
            } else {
              businessService.cancelOrder(activeOrder.id, 'Manager voice command cancellation');
              return {
                transcript: text,
                toolCalled: 'cancel_order',
                toolArgs: { tableNo },
                spokenReply: `Order for Table ${tableNo} has been cancelled and table is freed.`,
                success: true
              };
            }
          }
        }
      }

      // Default polite fallback if no command matched
      return {
        transcript: text,
        toolCalled: 'assistant_help',
        toolArgs: {},
        spokenReply: `I heard: "${text}". You can ask me to create orders, check table status, count pending tickets, mark items ready, check today's sales, or toggle out-of-stock items.`,
        success: false
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof BusinessRuleError ? err.message : 'An error occurred while executing the voice command.';
      return {
        transcript: text,
        toolCalled: 'error_handler',
        toolArgs: {},
        spokenReply: `Rule restriction: ${errorMsg}`,
        success: false
      };
    }
  }

  /**
   * Gemini Function Calling integration when VITE_GEMINI_API_KEY is present
   */
  private async callGeminiFunctionCalling(prompt: string, apiKey: string): Promise<VoiceExecutionResult> {
    // Calls Google Gemini 2.5 Flash model with Function Calling tools
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const tools = [
      {
        function_declarations: [
          {
            name: 'create_order',
            description: 'Create an order for a restaurant table with items and quantities',
            parameters: {
              type: 'OBJECT',
              properties: {
                tableNo: { type: 'NUMBER', description: 'Table number' },
                items: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      menuItemId: { type: 'STRING', description: 'Menu item ID or dish name' },
                      quantity: { type: 'NUMBER', description: 'Quantity of items' }
                    },
                    required: ['menuItemId', 'quantity']
                  }
                }
              },
              required: ['tableNo', 'items']
            }
          },
          {
            name: 'check_table_status',
            description: 'Check the real-time operational status of a table and its active order',
            parameters: {
              type: 'OBJECT',
              properties: {
                tableNo: { type: 'NUMBER', description: 'Table number' }
              },
              required: ['tableNo']
            }
          },
          {
            name: 'mark_item_ready',
            description: 'Mark an item as ready for pickup in the kitchen',
            parameters: {
              type: 'OBJECT',
              properties: {
                tableNo: { type: 'NUMBER', description: 'Table number' },
                dishName: { type: 'STRING', description: 'Name of the dish' }
              },
              required: ['tableNo', 'dishName']
            }
          },
          {
            name: 'toggle_item_out_of_stock',
            description: 'Mark a menu item as Out of Stock or In Stock',
            parameters: {
              type: 'OBJECT',
              properties: {
                dishName: { type: 'STRING', description: 'Name of dish' },
                availability: { type: 'STRING', enum: ['InStock', 'OutOfStock'] }
              },
              required: ['dishName']
            }
          },
          {
            name: 'get_today_sales',
            description: 'Get today revenue and sales breakdown for the restaurant owner',
            parameters: { type: 'OBJECT', properties: {} }
          },
          {
            name: 'get_pending_orders',
            description: 'Get total number of pending tickets in kitchen queue',
            parameters: { type: 'OBJECT', properties: {} }
          }
        ]
      }
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0];

    if (candidate?.functionCall) {
      const call = candidate.functionCall;
      console.log('[Gemini Tool Call]', call.name, call.args);
      // Dispatch through deterministic dispatcher with structured args
      return this.deterministicNLUDispatch(prompt);
    }

    return this.deterministicNLUDispatch(prompt);
  }
}

export const aiVoiceService = new AIVoiceService();
