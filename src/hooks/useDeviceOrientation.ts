'use client';

import { useEffect, useState } from 'react';

/**
 * デバイスの傾きセンサーから加速度データを取得
 * 物理演算エンジンの重力方向制御に使用
 */
export const useDeviceOrientation = () => {
  const [gravity, setGravity] = useState({ x: 0, y: 1 });
  const isSupported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;

  useEffect(() => {
    // DeviceOrientationEvent のサポート確認
    const hasDeviceOrientation = 'DeviceOrientationEvent' in window;
    const hasPermission = typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent;

    if (!hasDeviceOrientation && !hasPermission) {
      return;
    }

    // iOS 13+ では明示的なパーミッション要求が必要
    const requestPermission = async () => {
      if (hasPermission) {
        try {
          const permission = await (DeviceOrientationEvent as unknown as {
            requestPermission: () => Promise<string>;
          }).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (error) {
          console.error('Device orientation permission denied:', error);
          // フォールバック：通常のイベントリスナー登録
          window.addEventListener('deviceorientation', handleOrientation);
        }
      } else {
        // iOS 12以下、Android等
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // beta: 前後の傾き（-180 ~ 180）
      // gamma: 左右の傾き（-90 ~ 90）
      const beta = event.beta || 0;
      const gamma = event.gamma || 0;

      // 正規化（-1 ~ 1）
      const x = Math.sin((gamma * Math.PI) / 180) * 0.5;
      const y = Math.cos((beta * Math.PI) / 180);

      setGravity({ x, y: Math.max(y, 0.3) }); // y最小値0.3（完全に水平でも重力が働く）
    };

    requestPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return { gravity, isSupported };
};
