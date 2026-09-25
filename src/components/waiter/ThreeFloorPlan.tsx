import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { RestaurantTable } from '../../types';

interface ThreeFloorPlanProps {
  tables: RestaurantTable[];
  selectedTableNo: number | null;
  onSelectTable: (tableNo: number) => void;
}

export const ThreeFloorPlan: React.FC<ThreeFloorPlanProps> = ({
  tables,
  selectedTableNo,
  onSelectTable
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const tableMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 14, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff4e6, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 0.8, 30);
    pointLight.position.set(0, 8, 0);
    scene.add(pointLight);

    // 5. Floor Grid with dark restaurant aesthetic
    const floorGeometry = new THREE.PlaneGeometry(28, 22);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle grid helper
    const grid = new THREE.GridHelper(26, 26, 0x1e293b, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    // 6. Raycasting for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(tableMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && !hitObj.userData?.tableNo) {
          hitObj = hitObj.parent;
        }
        if (hitObj && hitObj.userData?.tableNo) {
          onSelectTable(hitObj.userData.tableNo);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handleClick);

    // 7. Mouse drag orbit controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      // Orbit around center
      const rotSpeed = 0.005;
      camera.position.x = camera.position.x * Math.cos(deltaX * rotSpeed) - camera.position.z * Math.sin(deltaX * rotSpeed);
      camera.position.z = camera.position.z * Math.cos(deltaX * rotSpeed) + camera.position.x * Math.sin(deltaX * rotSpeed);
      camera.position.y = Math.max(6, Math.min(24, camera.position.y - deltaY * 0.05));
      camera.lookAt(0, 0, 0);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.01;
      const factor = 1 + e.deltaY * zoomSpeed;
      camera.position.x = Math.max(-25, Math.min(25, camera.position.x * factor));
      camera.position.y = Math.max(6, Math.min(26, camera.position.y * factor));
      camera.position.z = Math.max(6, Math.min(28, camera.position.z * factor));
      camera.lookAt(0, 0, 0);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Subtle breathing motion for selected table
      tableMeshesRef.current.forEach((mesh, tNo) => {
        if (tNo === selectedTableNo) {
          mesh.position.y = 0.2 + Math.sin(Date.now() * 0.005) * 0.08;
        } else {
          mesh.position.y = 0;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize listener
    const handleResize = () => {
      if (!mount) return;
      const newWidth = mount.clientWidth;
      const newHeight = mount.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('pointerdown', handleClick);
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
    };
  }, [onSelectTable]);

  // Update or render table 3D meshes when tables or selectedTableNo change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old table meshes
    tableMeshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
    });
    tableMeshesRef.current.clear();

    const getStatusColor = (status: RestaurantTable['status']): number => {
      switch (status) {
        case 'Free': return 0x10b981; // Emerald Green
        case 'Occupied': return 0xf43f5e; // Rose Red
        case 'Reserved': return 0xf59e0b; // Amber
        case 'Billing': return 0x38bdf8; // Sky Blue
        default: return 0x64748b;
      }
    };

    tables.forEach((table) => {
      const group = new THREE.Group();
      group.userData = { tableNo: table.tableNo };

      const color = getStatusColor(table.status);
      const isSelected = table.tableNo === selectedTableNo;

      // Table Top Geometry
      let tableTopGeo: THREE.BufferGeometry;
      if (table.position.shape === 'round') {
        tableTopGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.3, 32);
      } else if (table.position.shape === 'rect') {
        tableTopGeo = new THREE.BoxGeometry(3.2, 0.3, 1.8);
      } else {
        tableTopGeo = new THREE.BoxGeometry(2.0, 0.3, 2.0);
      }

      const tableMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.1,
        emissive: isSelected ? color : 0x000000,
        emissiveIntensity: isSelected ? 0.4 : 0.0
      });

      const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
      tableTop.position.y = 1.1;
      tableTop.castShadow = true;
      tableTop.receiveShadow = true;
      tableTop.userData = { tableNo: table.tableNo };
      group.add(tableTop);

      // Center Pedestal / Legs
      const legGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.1, 16);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.5 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.y = 0.55;
      leg.castShadow = true;
      group.add(leg);

      // Base plate
      const baseGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.1, 16);
      const baseMesh = new THREE.Mesh(baseGeo, legMat);
      baseMesh.position.y = 0.05;
      group.add(baseMesh);

      // Canvas Sprite for Table Number label
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = isSelected ? '#ffffff' : '#0f172a';
        ctx.beginPath();
        ctx.arc(64, 64, 52, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#38bdf8' : '#ffffff';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#0f172a' : '#ffffff';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`T${table.tableNo}`, 64, 66);
      }

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(0, 2.3, 0);
      sprite.scale.set(1.5, 1.5, 1);
      group.add(sprite);

      // Position group in 3D floor space
      group.position.set(table.position.x, 0, table.position.z);
      scene.add(group as unknown as THREE.Mesh);
      tableMeshesRef.current.set(table.tableNo, group as unknown as THREE.Mesh);
    });
  }, [tables, selectedTableNo]);

  return (
    <div className="relative w-full h-[420px] md:h-[500px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-md">
      {/* 3D Canvas mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D View overlay instructions */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-700/60 backdrop-blur-sm">
          Interactive 3D Floor
        </span>
        <span className="text-[11px] text-slate-500">
          Drag to rotate • Scroll to zoom • Click table to view & order
        </span>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-4 left-4 right-4 md:right-auto bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-slate-300 font-medium">Free</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          <span className="text-slate-300 font-medium">Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          <span className="text-slate-300 font-medium">Reserved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          <span className="text-slate-300 font-medium">Billing</span>
        </div>
      </div>
    </div>
  );
};
