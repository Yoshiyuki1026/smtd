'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * デバイスの傾きセンサーから加速度データを取得
 * 物理演算エンジンの重力方向制御に使用
 *
 * iOS 13+ では明示的なパーミッション要求が必要（ユーザージェスチャー内で呼ぶ必要あり）
 */
export const useDeviceOrientation = () => {
  const [gravity, setGravity] = useState({ x: 0, y: 1 });
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'not-required'>('unknown');
  const isSupported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  const listenerAddedRef = useRef(false);

  // iOS 13+ でパーミッションが必要かどうか
  const needsPermission = typeof window !== 'undefined' &&
    typeof DeviceOrientationEvent !== 'undefined' &&
    'requestPermission' in DeviceOrientationEvent;

  // 傾き変更ハンドラ
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // beta: 前後の傾き（-180 ~ 180）
    // gamma: 左右の傾き（-90 ~ 90）
    const beta = event.beta || 0;
    const gamma = event.gamma || 0;

    // 正規化（-1 ~ 1）
    const x = Math.sin((gamma * Math.PI) / 180) * 0.5;
    const y = Math.cos((beta * Math.PI) / 180);

    setGravity({ x, y: Math.max(y, 0.3) }); // y最小値0.3（完全に水平でも重力が働く）
  }, []);

  // イベントリスナーを登録
  const addListener = useCallback(() => {
    if (listenerAddedRef.current) return;
    window.addEventListener('deviceorientation', handleOrientation);
    listenerAddedRef.current = true;
  }, [handleOrientation]);

  // iOS 13+ 向け: ユーザージェスチャー内で呼び出す許可リクエスト関数
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!needsPermission) {
      // iOS 12以下、Android等は許可不要
      addListener();
      setPermissionState('not-required');
      return true;
    }

    try {
      const permission = await (DeviceOrientationEvent as unknown as {
        requestPermission: () => Promise<string>;
      }).requestPermission();

      if (permission === 'granted') {
        addListener();
        setPermissionState('granted');
        return true;
      } else {
        setPermissionState('denied');
        return false;
      }
    } catch (error) {
      console.error('Device orientation permission error:', error);
      setPermissionState('denied');
      return false;
    }
  }, [needsPermission, addListener]);

  // 非iOS端末では自動でリスナー登録
  useEffect(() => {
    if (!isSupported) return;

    // iOS 13+ 以外は自動でリスナー登録
    if (!needsPermission) {
      addListener();
      // 状態更新は別のuseEffectで行う（set-state-in-effect回避）
    }

    return () => {
      if (listenerAddedRef.current) {
        window.removeEventListener('deviceorientation', handleOrientation);
        listenerAddedRef.current = false;
      }
    };
  }, [isSupported, needsPermission, addListener, handleOrientation]);

  // permissionState初期値の設定（set-state-in-effect回避）
  useEffect(() => {
    if (!needsPermission && permissionState === 'unknown') {
      // 遅延実行でReactのルールに準拠
      const timer = setTimeout(() => {
        setPermissionState('not-required');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [needsPermission, permissionState]);

  return {
    gravity,
    isSupported,
    needsPermission,
    permissionState,
    requestPermission,
  };
};
