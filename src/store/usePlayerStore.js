import { create } from "zustand";
import { useDataStore } from "./useDataStore";
import { readStorage, writeStorage } from "../lib/storage";
import { selectNextIndex } from "../lib/catalog";
import demo from "../data/catalog.json";
let audio,
  context,
  analyser,
  bands = [],
  sleepTimer,
  requestId = 0,
  playedId = null;
const settings = readStorage("music-player-settings", {
  volume: 0.7,
  repeat: "off",
  shuffle: false,
  eq: "flat",
});
function saveSettings() {
  const { volume, repeat, shuffle, eq } = usePlayerStore.getState();
  writeStorage("music-player-settings", { volume, repeat, shuffle, eq });
}
function getAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "metadata";
  audio.crossOrigin = "anonymous";
  audio.volume = usePlayerStore.getState().volume;
  audio.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(audio.duration))
      usePlayerStore.setState({ duration: audio.duration });
  });
  audio.addEventListener("playing", () => {
    const song = usePlayerStore.getState().currentSong;
    usePlayerStore.setState({ isPlaying: true, isLoading: false, error: "" });
    if (song && playedId !== song.id) {
      playedId = song.id;
      useDataStore.getState().recordPlay(song.id);
    }
    if (navigator.mediaSession)
      navigator.mediaSession.playbackState = "playing";
  });
  audio.addEventListener("waiting", () => {
    if (!audio.paused) usePlayerStore.setState({ isLoading: true });
  });
  audio.addEventListener("pause", () => {
    usePlayerStore.setState({ isPlaying: false, isLoading: false });
    if (navigator.mediaSession) navigator.mediaSession.playbackState = "paused";
  });
  audio.addEventListener("timeupdate", () => {
    usePlayerStore.setState({ progress: audio.currentTime });
    if (
      navigator.mediaSession?.setPositionState &&
      Number.isFinite(audio.duration) &&
      audio.duration > 0
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: 1,
          position: Math.min(audio.currentTime, audio.duration),
        });
      } catch {}
    }
  });
  audio.addEventListener("ended", () => {
    const state = usePlayerStore.getState();
    if (state.repeat === "one") {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else state.nextSong();
  });
  audio.addEventListener("error", () => {
    usePlayerStore.setState({
      isPlaying: false,
      isLoading: false,
      error:
        "This audio could not be played. Try another track or import a supported file.",
    });
  });
  if ("mediaSession" in navigator) {
    for (const [action, handler] of Object.entries({
      play: () => usePlayerStore.getState().play(),
      pause: () => usePlayerStore.getState().pause(),
      previoustrack: () => usePlayerStore.getState().prevSong(),
      nexttrack: () => usePlayerStore.getState().nextSong(),
      seekto: (details) =>
        usePlayerStore.getState().setProgress(details.seekTime),
      seekbackward: (details) =>
        usePlayerStore
          .getState()
          .setProgress(audio.currentTime - (details.seekOffset || 10)),
      seekforward: (details) =>
        usePlayerStore
          .getState()
          .setProgress(audio.currentTime + (details.seekOffset || 10)),
    })) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {}
    }
  }
  return audio;
}
function updateMedia(song) {
  if (!navigator.mediaSession || !window.MediaMetadata) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.albumTitle,
      artwork:
        song.coverUrl && !song.coverUrl.endsWith(".svg")
          ? [{ src: new URL(song.coverUrl, location.origin).href }]
          : [],
    });
  } catch {}
}
export function getAnalyser() {
  return analyser;
}
export function getAudioElement() {
  return audio;
}
export function enableAudioGraph() {
  try {
    const a = getAudio();
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      const source = context.createMediaElementSource(a);
      const low = context.createBiquadFilter();
      low.type = "lowshelf";
      low.frequency.value = 180;
      const mid = context.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 1400;
      mid.Q.value = 0.7;
      const high = context.createBiquadFilter();
      high.type = "highshelf";
      high.frequency.value = 5000;
      analyser = context.createAnalyser();
      analyser.fftSize = 128;
      source
        .connect(low)
        .connect(mid)
        .connect(high)
        .connect(analyser)
        .connect(context.destination);
      bands = [low, mid, high];
      const gains = {
        flat: [0, 0, 0],
        warm: [4, -1, -2],
        vocal: [-2, 4, 1],
        bright: [-1, 0, 4],
      }[usePlayerStore.getState().eq] || [0, 0, 0];
      bands.forEach((b, i) => (b.gain.value = gains[i]));
    }
    context.resume().catch(() => {});
    return true;
  } catch {
    return false;
  }
}
const initialSong =
  demo.songs.find((s) => s.id === readStorage("music-last-track", null)) ||
  demo.songs[0];
const initialQueue = demo.songs;
const usePlayerStore = create((set, get) => ({
  currentSong: initialSong,
  queue: initialQueue,
  currentIndex: initialQueue.findIndex((s) => s.id === initialSong.id),
  isPlaying: false,
  isLoading: false,
  error: "",
  volume: Math.max(0, Math.min(1, settings.volume)),
  muted: false,
  progress: 0,
  duration: 48,
  shuffle: settings.shuffle,
  repeat: settings.repeat,
  eq: settings.eq,
  showNowPlaying: false,
  showLyrics: false,
  showQueue: false,
  sleepUntil: null,
  playSong: async (song, songList, requestedIndex) => {
    if (!song?.audioUrl) {
      set({ error: "Choose a track with an audio file." });
      return;
    }
    const list = songList?.length
      ? songList
      : get().queue.some((s) => s.id === song.id)
        ? get().queue
        : [song, ...get().queue];
    const index = Number.isInteger(requestedIndex)
      ? requestedIndex
      : list.findIndex((s) => s.id === song.id);
    const same =
      get().currentSong?.id === song.id &&
      audio?.src === new URL(song.audioUrl, location.href).href;
    if (same) {
      if (
        Number.isInteger(requestedIndex) &&
        requestedIndex !== get().currentIndex
      )
        audio.currentTime = 0;
      set({ queue: list, currentIndex: index });
      await get().play();
      return;
    }
    const id = ++requestId;
    const a = getAudio();
    a.pause();
    playedId = null;
    set({
      currentSong: song,
      queue: list,
      currentIndex: index >= 0 ? index : 0,
      progress: 0,
      duration: song.duration || 0,
      isPlaying: false,
      isLoading: true,
      error: "",
    });
    a.src = song.audioUrl;
    a.volume = get().muted ? 0 : get().volume;
    updateMedia(song);
    writeStorage("music-last-track", song.id);
    try {
      if (context?.state === "suspended") await context.resume();
      await a.play();
      if (id !== requestId) return;
    } catch (e) {
      if (id === requestId && e.name !== "AbortError")
        set({
          isLoading: false,
          isPlaying: false,
          error:
            e.name === "NotAllowedError"
              ? "Press play to start listening."
              : "Unable to start this track. Try another audio file.",
        });
    }
  },
  togglePlay: () => (get().isPlaying ? get().pause() : get().play()),
  play: async () => {
    if (!audio?.src) {
      if (get().currentSong) await get().playSong(get().currentSong);
      return;
    }
    try {
      if (context?.state === "suspended") await context.resume();
      await audio.play();
    } catch {
      set({
        isPlaying: false,
        isLoading: false,
        error: "Press play to start this audio.",
      });
    }
  },
  pause: () => {
    audio?.pause();
    set({ isPlaying: false, isLoading: false });
  },
  stop: () => {
    requestId++;
    audio?.pause();
    if (audio) {
      audio.removeAttribute("src");
      audio.load();
    }
    set({ isPlaying: false, isLoading: false, progress: 0, error: "" });
  },
  nextSong: () => {
    const state = get();
    const index = selectNextIndex({
      queue: state.queue,
      index: state.currentIndex,
      shuffle: state.shuffle,
      repeat: state.repeat,
    });
    if (index < 0) {
      get().pause();
      set({ progress: get().duration });
      return;
    }
    get().playSong(state.queue[index], state.queue, index);
  },
  prevSong: () => {
    if (get().progress > 3) {
      get().setProgress(0);
      return;
    }
    const index = Math.max(0, get().currentIndex - 1);
    if (get().queue[index])
      get().playSong(get().queue[index], get().queue, index);
  },
  setProgress: (value) => {
    const progress = Math.max(0, Math.min(Number(value) || 0, get().duration));
    if (audio?.readyState >= 1) audio.currentTime = progress;
    set({ progress });
  },
  setVolume: (value) => {
    const volume = Math.max(0, Math.min(1, Number(value) || 0));
    if (audio) audio.volume = get().muted ? 0 : volume;
    set({ volume });
    saveSettings();
  },
  toggleMute: () => {
    const muted = !get().muted;
    if (audio) audio.volume = muted ? 0 : get().volume;
    set({ muted });
  },
  toggleShuffle: () => {
    set({ shuffle: !get().shuffle });
    saveSettings();
  },
  toggleRepeat: () => {
    set({
      repeat: { off: "all", all: "one", one: "off" }[get().repeat] || "off",
    });
    saveSettings();
  },
  setEqualizer: (eq) => {
    if (!enableAudioGraph()) {
      set({ error: "Audio processing is unavailable in this browser." });
      return;
    }
    const gains = {
      flat: [0, 0, 0],
      warm: [4, -1, -2],
      vocal: [-2, 4, 1],
      bright: [-1, 0, 4],
    }[eq] || [0, 0, 0];
    bands.forEach((b, i) =>
      b.gain.setTargetAtTime(gains[i], context.currentTime, 0.15),
    );
    set({ eq });
    saveSettings();
  },
  addToQueue: (song, next = false) => {
    const queue = [...get().queue];
    if (next) queue.splice(get().currentIndex + 1, 0, song);
    else queue.push(song);
    set({ queue });
  },
  resetLibrary: () => {
    get().stop();
    playedId = null;
    set({
      currentSong: demo.songs[0],
      queue: demo.songs,
      currentIndex: 0,
      duration: demo.songs[0].duration,
      showNowPlaying: false,
      showLyrics: false,
      showQueue: false,
    });
  },
  removeTrack: (id) => {
    const state = get();
    const queue = state.queue.filter((s) => s.id !== id);
    if (state.currentSong?.id === id) {
      get().stop();
      set({
        queue,
        currentSong: queue[0] || null,
        currentIndex: 0,
        duration: queue[0]?.duration || 0,
      });
    } else
      set({
        queue,
        currentIndex: Math.max(
          0,
          queue.findIndex((s) => s.id === state.currentSong?.id),
        ),
      });
  },
  removeFromQueue: (index) => {
    const state = get();
    const queue = state.queue.filter((_, i) => i !== index);
    if (index === state.currentIndex) {
      if (!queue.length) {
        get().stop();
        set({ queue: [], currentSong: null, currentIndex: 0 });
        return;
      }
      const i = Math.min(index, queue.length - 1);
      if (state.isPlaying) get().playSong(queue[i], queue);
      else {
        get().stop();
        set({
          queue,
          currentSong: queue[i],
          currentIndex: i,
          duration: queue[i].duration,
        });
      }
    } else
      set({
        queue,
        currentIndex:
          index < state.currentIndex
            ? state.currentIndex - 1
            : state.currentIndex,
      });
  },
  moveInQueue: (index, direction) => {
    const queue = [...get().queue],
      to = index + direction;
    if (to < 0 || to >= queue.length) return;
    [queue[index], queue[to]] = [queue[to], queue[index]];
    let currentIndex = get().currentIndex;
    if (index === currentIndex) currentIndex = to;
    else if (to === currentIndex) currentIndex = index;
    set({ queue, currentIndex });
  },
  clearUpcoming: () =>
    set({ queue: get().queue.slice(0, get().currentIndex + 1) }),
  setSleepTimer: (minutes) => {
    clearTimeout(sleepTimer);
    if (!minutes) {
      set({ sleepUntil: null });
      return;
    }
    const sleepUntil = Date.now() + minutes * 60000;
    set({ sleepUntil });
    sleepTimer = setTimeout(() => {
      get().pause();
      set({ sleepUntil: null });
    }, minutes * 60000);
  },
  toggleNowPlaying: () => set({ showNowPlaying: !get().showNowPlaying }),
  closeNowPlaying: () => set({ showNowPlaying: false }),
  toggleLyrics: () => set({ showLyrics: !get().showLyrics, showQueue: false }),
  toggleQueue: () => set({ showQueue: !get().showQueue, showLyrics: false }),
  setError: (error) => set({ error }),
}));
export default usePlayerStore;
