<template>
  <div class="video-player">
    <div class="player-container" ref="playerContainer">
      <canvas ref="canvas" width="1280" height="720"></canvas>
    </div>
    <div class="controls" ref="controlsElement">
      <button @click="togglePlay" class="play-button">
        <span v-if="!playing" class="play-icon">▶</span>
        <span v-else class="pause-icon">⏸</span>
      </button>
      <span class="current-time">{{ formatTime(currentTime) }}</span>
      <div class="progress-bar-container" @mousedown="startDraggingProgressBar">
        <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
      </div>
      <span class="duration">{{ formatTime(totalDuration) }}</span>
      <div class="volume-controls">
        <button @click="toggleMute" class="volume-button">
          <span v-if="!volumeMuted" class="volume-icon">🔊</span>
          <span v-else class="mute-icon">🔇</span>
        </button>
        <div class="volume-bar-container" @mousedown="startDraggingVolumeBar">
          <div class="volume-bar" :style="{ width: volumePercentage + '%' }"></div>
        </div>
      </div>
    </div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
  ALL_FORMATS,
  BlobSource,
  UrlSource,
  Input,
  CanvasSink,
  AudioBufferSink,
  type WrappedCanvas,
  type WrappedAudioBuffer
} from 'mediabunny'

const props = defineProps<{
  resource: File | string
}>()

const playerContainer = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const controlsElement = ref<HTMLDivElement | null>(null)

const playing = ref(false)
const currentTime = ref(0)
const totalDuration = ref(0)
const progressPercentage = ref(0)
const volume = ref(0.7)
const volumeMuted = ref(false)
const volumePercentage = ref(70)
const error = ref('')

let audioContext: AudioContext | null = null
let gainNode: GainNode | null = null
let videoSink: CanvasSink | null = null
let audioSink: AudioBufferSink | null = null
let videoFrameIterator: AsyncGenerator<WrappedCanvas, void, unknown> | null = null
let audioBufferIterator: AsyncGenerator<WrappedAudioBuffer, void, unknown> | null = null
let nextFrame: any = null
let queuedAudioNodes = new Set<AudioBufferSourceNode>()
let asyncId = 0
let audioContextStartTime: number | null = null
let playbackTimeAtStart = 0
let draggingProgressBar = false
let draggingVolumeBar = false
let fileLoaded = true

const initMediaPlayer = async () => {
  try {
    if (playing.value) {
      pause()
    }

    if (videoFrameIterator) await videoFrameIterator.return()
    if (audioBufferIterator) await audioBufferIterator.return()
    asyncId++

    error.value = ''

    const source = props.resource instanceof File ? new BlobSource(props.resource) : new UrlSource(props.resource)

    const input = new Input({
      source,
      formats: ALL_FORMATS
    })

    playbackTimeAtStart = 0
    totalDuration.value = await input.computeDuration()

    const videoTrack = await input.getPrimaryVideoTrack()
    videoSink =
      videoTrack &&
      new CanvasSink(videoTrack, {
        poolSize: 2,
        fit: 'contain' // In case the video changes dimensions over time
      })

    let audioTrack = await input.getPrimaryAudioTrack()
    audioSink = audioTrack && new AudioBufferSink(audioTrack)

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext

    audioContext = new AudioContext({ sampleRate: audioTrack?.sampleRate })
    gainNode = audioContext.createGain()
    gainNode.connect(audioContext.destination)

    // Create a new iterator
    videoFrameIterator = videoSink?.canvases(getPlaybackTime()) ?? null
    audioBufferIterator = audioSink?.buffers() ?? null
    fileLoaded = true
    await updatePlayerState()
  } catch (err) {
    error.value = 'Failed to load media: ' + (err as Error).message
  }
}

// const updateVolume = () => {
//   const actualVolume = volumeMuted ? 0 : volume

//   volumeBar.style.width = `${actualVolume * 100}%`
//   gainNode!.gain.value = actualVolume ** 2 // Quadratic for more fine-grained control

//   const iconNumber = volumeMuted ? 0 : Math.ceil(1 + 3 * volume)
//   for (let i = 0; i < volumeIconWrapper.children.length; i++) {
//     const icon = volumeIconWrapper.children[i] as HTMLImageElement
//     icon.style.display = i === iconNumber ? '' : 'none'
//   }
// }

const getPlaybackTime = () => {
  if (playing && audioContext) {
    // To ensure perfect audio-video sync, we always use the audio context's clock to determine playback time, even
    // when there is no audio track.
    return audioContext!.currentTime - audioContextStartTime! + playbackTimeAtStart
  } else {
    return playbackTimeAtStart
  }
}

const updatePlayerState = async () => {
  // TODO: Implement frame and audio buffer updates
}

const togglePlay = () => {
  if (playing.value) {
    pause()
  } else {
    play()
  }
}

const startVideoIterator = async () => {
  if (!videoSink) {
    return
  }

  asyncId++

  await videoFrameIterator?.return() // Dispose of the current iterator

  // Create a new iterator
  videoFrameIterator = videoSink.canvases(getPlaybackTime())

  // Get the first two frames
  const firstFrame = (await videoFrameIterator.next()).value ?? null
  const secondFrame = (await videoFrameIterator.next()).value ?? null

  nextFrame = secondFrame

  if (firstFrame) {
    // Draw the first frame
    const context = canvas.value!.getContext('2d', { alpha: false, desynchronized: true })!

    context.drawImage(firstFrame.canvas, 0, 0)
  }
}

/** Loops over the audio buffer iterator, scheduling the audio to be played in the audio context. */
const runAudioIterator = async () => {
  if (!audioSink) {
    return
  }

  // To play back audio, we loop over all audio chunks (typically very short) of the file and play them at the correct
  // timestamp. The result is a continuous, uninterrupted audio signal.
  for await (const { buffer, timestamp } of audioBufferIterator!) {
    const node = audioContext!.createBufferSource()
    node.buffer = buffer
    node.connect(gainNode!)

    const startTimestamp = audioContextStartTime! + timestamp - playbackTimeAtStart

    // Two cases: Either, the audio starts in the future or in the past
    if (startTimestamp >= audioContext!.currentTime) {
      // If the audio starts in the future, easy, we just schedule it
      node.start(startTimestamp)
    } else {
      // If it starts in the past, then let's only play the audible section that remains from here on out
      node.start(audioContext!.currentTime, audioContext!.currentTime - startTimestamp)
    }

    queuedAudioNodes.add(node)
    node.onended = () => {
      queuedAudioNodes.delete(node)
    }

    // If we're more than a second ahead of the current playback time, let's slow down the loop until time has
    // passed.
    if (timestamp - getPlaybackTime() >= 1) {
      await new Promise<void>((resolve) => {
        const id = setInterval(() => {
          if (timestamp - getPlaybackTime() < 1) {
            clearInterval(id)
            resolve()
          }
        }, 100)
      })
    }
  }
}

const play = async () => {
  if (audioContext!.state === 'suspended') {
    await audioContext!.resume()
  }

  await audioContext!.resume()
  playbackTimeAtStart = 0
  await startVideoIterator()
  if (getPlaybackTime() === totalDuration.value) {
    // If we're at the end, let's snap back to the start
  }

  audioContextStartTime = audioContext!.currentTime
  playing.value = true

  if (audioSink) {
    // Start the audio iterator
    void audioBufferIterator?.return()
    audioBufferIterator = audioSink?.buffers(getPlaybackTime())
    void runAudioIterator()
  }
}

/** Runs every frame; updates the canvas if necessary. */
const render = (requestFrame = true) => {
  if (fileLoaded) {
    const playbackTime = getPlaybackTime()
    if (playbackTime >= totalDuration.value) {
      // Pause playback once the end is reached
      pause()
      playbackTimeAtStart = totalDuration.value
    }

    // Check if the current playback time has caught up to the next frame
    const context = canvas.value!.getContext('2d', { alpha: false, desynchronized: true })!
    if (nextFrame && nextFrame.timestamp <= playbackTime) {
      context.drawImage(nextFrame.canvas, 0, 0)
      nextFrame = null

      // Request the next frame
      void updateNextFrame()
    }

    if (!draggingProgressBar) {
    }
  }

  if (requestFrame) {
    requestAnimationFrame(() => render())
  }
}

// Also call the render function on an interval to make sure the video keeps updating even if the tab isn't visible
setInterval(() => render(false), 500)

/** Iterates over the video frame iterator until it finds a video frame in the future. */
const updateNextFrame = async () => {
  const currentAsyncId = asyncId

  // We have a loop here because we may need to iterate over multiple frames until we reach a frame in the future
  while (true) {
    const newNextFrame = (await videoFrameIterator!.next()).value ?? null
    if (!newNextFrame) {
      break
    }

    if (currentAsyncId !== asyncId) {
      break
    }

    const playbackTime = getPlaybackTime()
    const context = canvas.value!.getContext('2d', { alpha: false, desynchronized: true })!
    if (newNextFrame.timestamp <= playbackTime) {
      // Draw it immediately
      context.drawImage(newNextFrame.canvas, 0, 0)
    } else {
      // Save it for later
      nextFrame = newNextFrame
      break
    }
  }
}

const pause = () => {
  playbackTimeAtStart = getPlaybackTime()
  playing.value = false
  void audioBufferIterator?.return() // This stops any for-loops that are iterating the iterator
  audioBufferIterator = null

  // Stop all audio nodes that were already queued to play
  for (const node of queuedAudioNodes) {
    node.stop()
  }
  queuedAudioNodes.clear()
}

const toggleMute = () => {
  volumeMuted.value = !volumeMuted.value
}

const startDraggingProgressBar = () => {
  draggingProgressBar = true
}

const startDraggingVolumeBar = () => {
  draggingVolumeBar = true
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

onMounted(() => {
  initMediaPlayer()
  render()
})

onBeforeUnmount(() => {
  if (playing.value) {
    pause()
  }
  if (videoFrameIterator) videoFrameIterator.return()
  if (audioBufferIterator) audioBufferIterator.return()
})
</script>

<style scoped>
.video-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.player-container {
  width: 100%;
  background-color: #000;
}

canvas {
  width: 100%;
  height: auto;
  display: block;
}

.controls {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px;
  background-color: #333;
  color: white;
}

.play-button {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
}

.progress-bar-container {
  flex-grow: 1;
  height: 10px;
  background-color: #555;
  margin: 0 10px;
  cursor: pointer;
}

.progress-bar {
  height: 100%;
  background-color: #1e90ff;
}

.volume-controls {
  display: flex;
  align-items: center;
}

.volume-bar-container {
  width: 80px;
  height: 10px;
  background-color: #555;
  margin-left: 5px;
  cursor: pointer;
}

.volume-bar {
  height: 100%;
  background-color: #1e90ff;
}

.error-message {
  color: red;
  margin-top: 10px;
}
</style>
