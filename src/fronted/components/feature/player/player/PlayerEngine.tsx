/**
 * 渲染实际的视频播放器，并负责把播放器事件同步回播放器 store。
 */
import React, { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player/file';
import { usePlayerState } from '@/fronted/hooks/usePlayerState';
import { shallow } from 'zustand/shallow';

/**
 * 播放器引擎组件入参。
 */
export interface PlayerEngineProps {
  /** ReactPlayer 进度回调间隔，单位毫秒。 */
  progressInterval?: number;
  /** 播放器容器宽度。 */
  width?: string | number;
  /** 播放器容器高度。 */
  height?: string | number;
  /** 底层播放器准备完成后的回调。 */
  onReady?: () => void;
  /** 媒体播放结束后的回调。 */
  onEnded?: () => void;
  /** 向上层暴露内部 video 元素句柄。 */
  onProvideVideoElement?: (video: HTMLVideoElement | null) => void;
  /** 透传给播放器容器的样式类名。 */
  className?: string;
}

/**
 * 承载底层媒体播放，并把播放进度、时长和视频元素句柄回传给上层。
 */
const PlayerEngine: React.FC<PlayerEngineProps> = ({
  progressInterval = 50,
  width = 0,
  height = 0,
  onReady,
  onEnded,
  onProvideVideoElement,
  className
}) => {
  const {
    src,
    playing,
    muted,
    volume,
    seekTime,
    playbackRate,
    setDuration,
    updateExactPlayTime,
    play
  } = usePlayerState((s) => ({
    src: s.src,
    playing: s.playing,
    muted: s.muted,
    volume: s.volume,
    seekTime: s.seekTime,
    playbackRate: s.playbackRate,
    setDuration: s.setDuration,
    updateExactPlayTime: s.updateExactPlayTime,
    play: s.play
  }), shallow);

  const playerRef = useRef<ReactPlayer>(null);
  const lastSeekRef = useRef<{ time: number }>({ time: -1 });
  const lastSeekTsRef = useRef<number>(0);
  const pendingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!playerRef.current) return;
    const next = seekTime;

    if (lastSeekRef.current === next) return;

    const now = Date.now();
    const delta = now - lastSeekTsRef.current;

    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }

    const applySeek = (sec: number) => {
      try {
        playerRef.current?.seekTo(sec, 'seconds');
        play();
      } catch {
        // ignore
      }
    };

    const delay = Math.max(0, 200 - delta);
    pendingTimerRef.current = setTimeout(() => {
      applySeek(next.time);
      lastSeekRef.current = next;
      lastSeekTsRef.current = Date.now();
      pendingTimerRef.current = null;
    }, delay);

    return () => {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
    };
  }, [seekTime, play]);

  useEffect(() => {
    return () => {
      if (onProvideVideoElement) {
        onProvideVideoElement(null);
      }
    };
  }, [onProvideVideoElement]);

  return (
    <ReactPlayer
      ref={playerRef}
      url={src || undefined}
      playing={playing}
      muted={muted}
      volume={volume}
      playbackRate={playbackRate}
      width={width}
      height={height}
      progressInterval={progressInterval}
      controls={false}
      tabIndex={-1}
      config={{ attributes: { controlsList: 'nofullscreen' } }}
      className={className}
      onProgress={(p) => {
        if (typeof p.playedSeconds === 'number') {
          updateExactPlayTime(p.playedSeconds);
        }
      }}
      onDuration={(d) => setDuration(d)}
      onReady={() => {
        if (onProvideVideoElement) {
          const internal = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
          onProvideVideoElement(internal ?? null);
        }
        onReady?.();
      }}
      onEnded={onEnded}
    />
  );
};

export default PlayerEngine;
