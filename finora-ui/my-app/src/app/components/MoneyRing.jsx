"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

export default function MoneyRing() {
  const containerRef = useRef(null);
  const pathname = usePathname();

  // Рефы для плавного перехода (lerp) целевых параметров
  const targetPosition = useRef({ x: 0, y: 0, z: 0 });
  const targetScale = useRef(1.0);
  const targetOpacity = useRef(1.0);

  // Отслеживаем изменение роута и выставляем целевые координаты
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleRouteChange = () => {
      const isMobile = window.innerWidth < 768;

      if (pathname === "/") {
        // Главная страница: Кольцо по центру, крупное, яркое
        targetPosition.current = { x: 0, y: 0, z: 0 };
        targetScale.current = isMobile ? 0.65 : 1.0;
        targetOpacity.current = 1.0;
      } else if (pathname.includes("verification")) {
        // Верификация: Кольцо по центру, полупрозрачное, среднее
        targetPosition.current = { x: 0, y: 0, z: 0 };
        targetScale.current = isMobile ? 0.55 : 0.8;
        targetOpacity.current = 0.4;
      } else {
        // Регистрация, профиль, коопилот: Смещено вправо, уменьшено
        targetPosition.current = isMobile 
          ? { x: 0, y: -0.7, z: 0 } 
          : { x: 1.8, y: -0.2, z: 0 };
        targetScale.current = isMobile ? 0.45 : 0.7;
        targetOpacity.current = 0.6;
      }
    };

    handleRouteChange();

    // Дополнительно отслеживаем ресайз для адаптивного лерпа
    window.addEventListener("resize", handleRouteChange);
    return () => window.removeEventListener("resize", handleRouteChange);
  }, [pathname]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.sortObjects = true;

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 5.5);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const dir = new THREE.DirectionalLight(0xfff8e7, 2.2);
    dir.position.set(5, 8, 5);
    scene.add(dir);

    const pl1 = new THREE.PointLight(0xffcc44, 2.5, 25);
    pl1.position.set(-3, 3, 3);
    scene.add(pl1);

    const pl2 = new THREE.PointLight(0x88ccff, 1.5, 20);
    pl2.position.set(3, -2, 2);
    scene.add(pl2);

    const createGoldMaterial = () =>
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 1,
        roughness: 0.15,
      });

    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xdaa520,
      metalness: 1,
      roughness: 0.2,
    });

    const BASE_RING_RADIUS = 1.6;

    const ringMesh = new THREE.Mesh(
      new THREE.TorusGeometry(BASE_RING_RADIUS, 0.16, 24, 120),
      createGoldMaterial()
    );
    scene.add(ringMesh);

    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    // Coins on ring
    const coins = [];
    const coinGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 40);
    const edgeGeometry = new THREE.TorusGeometry(0.25, 0.009, 8, 40);

    for (let i = 0; i < 10; i++) {
      const coin = new THREE.Mesh(coinGeometry, createGoldMaterial());
      const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edge.rotation.x = Math.PI / 2;
      coin.add(edge);

      coins.push({
        mesh: coin,
        angle: (i / 10) * Math.PI * 2,
        speed: 0.32 + (i % 3) * 0.07,
      });

      ringGroup.add(coin);
    }

    // Floating coins
    const floatCoins = [];
    const floatGeometry = new THREE.CylinderGeometry(0.14, 0.14, 0.04, 32);

    for (let i = 0; i < 5; i++) {
      const coin = new THREE.Mesh(floatGeometry, createGoldMaterial());
      floatCoins.push({
        mesh: coin,
        orbitAngle: (i / 5) * Math.PI * 2,
        orbitSpeed: 0.15 + i * 0.025,
        orbitR: 2.2 + (i % 3) * 0.28,
        floatPhase: (i / 5) * Math.PI * 2,
        tiltX: (i % 2 === 0 ? 1 : -1) * 0.6,
        tiltZ: (i % 3 === 0 ? 1 : -0.5) * 0.4,
      });
      scene.add(coin);
    }

    let time = 0;
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.016;

      // 1. СМУЗ-ЛЕРП (Плавная интерполяция) положения и масштаба кольца
      ringMesh.position.x += (targetPosition.current.x - ringMesh.position.x) * 0.06;
      ringMesh.position.y += (targetPosition.current.y - ringMesh.position.y) * 0.06;
      ringMesh.position.z += (targetPosition.current.z - ringMesh.position.z) * 0.06;
      ringGroup.position.copy(ringMesh.position);

      const s = ringMesh.scale.x + (targetScale.current - ringMesh.scale.x) * 0.06;
      ringMesh.scale.set(s, s, s);
      ringGroup.scale.set(s, s, s);

      // Плавная регулировка прозрачности контейнера
      const currentOpacity = parseFloat(container.style.opacity || "1");
      const nextOpacity = currentOpacity + (targetOpacity.current - currentOpacity) * 0.06;
      container.style.opacity = nextOpacity.toString();

      // Стандартная анимация вращения
      const rotationY = time * 0.28;
      const rotationZ = Math.sin(time * 0.18) * 0.06;

      ringMesh.rotation.set(Math.PI * 0.18, rotationY, rotationZ);
      ringGroup.rotation.copy(ringMesh.rotation);

      coins.forEach((coin, index) => {
        const angle = coin.angle + time * coin.speed;
        coin.mesh.position.set(
          Math.cos(angle) * BASE_RING_RADIUS,
          Math.sin(angle) * BASE_RING_RADIUS,
          0
        );
        coin.mesh.rotation.z = angle;
        coin.mesh.material.color.setHSL(0.13, 1, 0.48 + 0.1 * Math.sin(time * 1.5 + index));
      });

      // Привязываем орбиты летающих монет к плавающему положению кольца
      floatCoins.forEach((coin, index) => {
        const angle = coin.orbitAngle + time * coin.orbitSpeed;
        coin.mesh.position.set(
          ringMesh.position.x + Math.cos(angle) * coin.orbitR * s,
          ringMesh.position.y + Math.sin(coin.floatPhase + time * 0.55) * 0.65 * s,
          ringMesh.position.z + Math.sin(angle) * coin.orbitR * 0.38 * s
        );

        coin.mesh.rotation.x = coin.tiltX + time * 0.38;
        coin.mesh.rotation.z = coin.tiltZ + time * 0.22;
        coin.mesh.material.color.setHSL(0.12, 0.95, 0.46 + 0.1 * Math.sin(time + index));
      });

      pl1.position.set(Math.sin(time * 0.5) * 4, 3, Math.cos(time * 0.5) * 4);
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      // ИСПРАВЛЕНО: Класс z-11 изменен на фоновый z-0
      className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-300"
      style={{ opacity: 0 }}
    />
  );
}