import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2Icon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  RotateCwIcon,
  Volume2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { get } from "@/lib/api-client";

const SKIP_SECONDS = 10;

/** Avoid re-fetching presigned URLs when scrolling the consultation list. */
const presignedUrlCache = new Map<string, string>();

type LoadPhase = "idle" | "fetching-url" | "buffering" | "ready" | "error";

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type ConsultationRecordingPlayerProps = {
  recordingMongoId: string;
  recordingLabel?: string;
  expectedDuration?: number;
  compact?: boolean;
  /** List cards: load only when user asks (faster history page). Detail view loads immediately. */
  lazy?: boolean;
};

export function ConsultationRecordingPlayer({
  recordingMongoId,
  recordingLabel,
  expectedDuration,
  compact = false,
  lazy = compact,
}: ConsultationRecordingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadPhase, setLoadPhase] = useState<LoadPhase>(lazy ? "idle" : "fetching-url");
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(expectedDuration ?? 0);
  const [bufferedRatio, setBufferedRatio] = useState(0);
  const [userRequestedLoad, setUserRequestedLoad] = useState(!lazy);
  const readyRef = useRef(false);

  const isLoading = loadPhase === "fetching-url" || loadPhase === "buffering";
  const isReady = loadPhase === "ready";

  const loadAudio = useCallback(async () => {
    if (!recordingMongoId) return;
    setLoadPhase("fetching-url");
    setError(null);
    setBufferedRatio(0);

    try {
      let url = presignedUrlCache.get(recordingMongoId);
      if (!url) {
        const res = await get(
          `/api/recordings/${recordingMongoId}?include_presigned_url=true`
        );
        const recording = res.data?.recording ?? res.data;
        url =
          recording?.presignedUrl ||
          recording?.fileUrl ||
          recording?.s3Url ||
          null;
        if (!url) {
          throw new Error("No playback URL available for this recording.");
        }
        presignedUrlCache.set(recordingMongoId, url);
      }
      setAudioUrl(url);
      setLoadPhase("buffering");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load recording.");
      setAudioUrl(null);
      setLoadPhase("error");
    }
  }, [recordingMongoId]);

  useEffect(() => {
    if (!userRequestedLoad) {
      setLoadPhase("idle");
      return;
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(expectedDuration ?? 0);
    setBufferedRatio(0);
    void loadAudio();
  }, [loadAudio, expectedDuration, userRequestedLoad]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const markReady = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      readyRef.current = true;
      setLoadPhase("ready");
    };

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onProgress = () => {
      if (!audio.duration || !Number.isFinite(audio.duration)) return;
      try {
        if (audio.buffered.length > 0) {
          const end = audio.buffered.end(audio.buffered.length - 1);
          setBufferedRatio(Math.min(1, end / audio.duration));
        }
      } catch {
        /* ignore */
      }
      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        markReady();
      }
    };
    const onCanPlay = () => markReady();
    const onWaiting = () => {
      if (readyRef.current) {
        setLoadPhase("buffering");
      }
    };
    const onPlaying = () => {
      setIsPlaying(true);
      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        markReady();
      }
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      readyRef.current = false;
      setError("Could not load audio from storage. Try again.");
      setLoadPhase("error");
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("progress", onProgress);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    audio.preload = "auto";
    audio.load();

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("progress", onProgress);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [audioUrl]);

  useEffect(() => {
    readyRef.current = false;
  }, [audioUrl, userRequestedLoad]);

  const startLoad = () => setUserRequestedLoad(true);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || !isReady) return;
    if (audio.paused) {
      try {
        setLoadPhase("buffering");
        await audio.play();
      } catch {
        setError("Playback failed. Try again.");
        setLoadPhase("error");
      }
    } else {
      audio.pause();
    }
  };

  const skip = (delta: number) => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;
    const max = Number.isFinite(audio.duration) ? audio.duration : duration;
    const next = Math.min(Math.max(0, audio.currentTime + delta), max || audio.currentTime + delta);
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const onSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !value.length || !isReady) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  if (loadPhase === "idle" && lazy) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 w-full sm:w-auto"
        onClick={startLoad}
      >
        <Volume2Icon className="w-4 h-4" />
        Load original recording
      </Button>
    );
  }

  if (loadPhase === "error") {
    return (
      <div className="text-sm text-red-600 py-2 flex flex-wrap items-center gap-2">
        <span>{error || "Could not load recording."}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            presignedUrlCache.delete(recordingMongoId);
            setUserRequestedLoad(true);
            void loadAudio();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading && !audioUrl) {
    return (
      <LoadingPanel
        compact={compact}
        message="Connecting to secure storage…"
        subMessage="Fetching playback link"
        progress={0}
      />
    );
  }

  if (!audioUrl) return null;

  const displayDuration = duration > 0 ? duration : expectedDuration ?? 0;
  const loadingMessage =
    loadPhase === "fetching-url"
      ? "Connecting to secure storage…"
      : "Loading audio from cloud…";
  const loadingSub =
    loadPhase === "buffering" && bufferedRatio > 0
      ? `${Math.round(bufferedRatio * 100)}% buffered — almost ready`
      : loadPhase === "buffering"
        ? "Downloading recording — controls unlock when ready"
        : "Fetching playback link";

  return (
    <div
      className={
        compact
          ? "rounded-lg border bg-muted/30 p-3 space-y-2"
          : "rounded-lg border bg-muted/20 p-4 space-y-3"
      }
    >
      {recordingLabel && !compact && (
        <p className="text-sm font-medium text-foreground">{recordingLabel}</p>
      )}

      {isLoading && (
        <LoadingPanel
          compact={compact}
          message={loadingMessage}
          subMessage={loadingSub}
          progress={loadPhase === "buffering" ? bufferedRatio : undefined}
        />
      )}

      <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />

      <div className={`flex items-center gap-2 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          disabled={!isReady}
          onClick={() => skip(-SKIP_SECONDS)}
          title={`Back ${SKIP_SECONDS}s`}
        >
          <RotateCcwIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
          disabled={!isReady}
          onClick={() => void togglePlay()}
          title={isReady ? (isPlaying ? "Pause" : "Play") : "Loading…"}
        >
          {isLoading ? (
            <Loader2Icon className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <PauseIcon className="w-4 h-4" />
          ) : (
            <PlayIcon className="w-4 h-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          disabled={!isReady}
          onClick={() => skip(SKIP_SECONDS)}
          title={`Forward ${SKIP_SECONDS}s`}
        >
          <RotateCwIcon className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums ml-1">
          {formatClock(currentTime)} / {formatClock(displayDuration)}
        </span>
      </div>

      <Slider
        value={[currentTime]}
        min={0}
        max={displayDuration > 0 ? displayDuration : Math.max(currentTime, 1)}
        step={0.1}
        onValueChange={onSeek}
        disabled={!isReady}
        className={`w-full ${!isReady ? "opacity-50" : ""}`}
      />

      {!compact && isReady && (
        <p className="text-xs text-muted-foreground">
          Original consultation recording from secure storage (S3).
        </p>
      )}
    </div>
  );
}

function LoadingPanel({
  compact,
  message,
  subMessage,
  progress,
}: {
  compact?: boolean;
  message: string;
  subMessage?: string;
  progress?: number;
}) {
  return (
    <div
      className={
        compact
          ? "flex flex-col gap-2 py-1"
          : "flex flex-col gap-2 rounded-md bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 px-3 py-3"
      }
    >
      <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
        <Loader2Icon className="w-4 h-4 shrink-0 animate-spin" />
        <span className="font-medium">{message}</span>
      </div>
      {subMessage && (
        <p className="text-xs text-muted-foreground pl-6">{subMessage}</p>
      )}
      {progress !== undefined && progress > 0 && (
        <div className="pl-6 pr-1">
          <div className="h-1.5 w-full rounded-full bg-blue-100 dark:bg-blue-900 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
