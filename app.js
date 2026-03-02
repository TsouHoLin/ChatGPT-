const storyPromptEl = document.getElementById('storyPrompt');
const storyOutputEl = document.getElementById('storyOutput');
const generateStoryBtn = document.getElementById('generateStoryBtn');
const bookArtBtn = document.getElementById('bookArtBtn');

const startRecordBtn = document.getElementById('startRecordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const transcribeBtn = document.getElementById('transcribeBtn');
const audioArtBtn = document.getElementById('audioArtBtn');
const playbackEl = document.getElementById('playback');
const transcriptEl = document.getElementById('transcript');

const audioCanvas = document.getElementById('audioCanvas');
const audioCtx = audioCanvas.getContext('2d');
const bookCanvas = document.getElementById('bookCanvas');
const bookCtx = bookCanvas.getContext('2d');

let mediaRecorder;
let recordedChunks = [];
let currentBook = [];

function generateBookFromSentence(sentence) {
  const hero = sentence.replace(/[。！!？?]/g, '').slice(0, 12) || '小熊';
  return [
    `第1页：在一个阳光明媚的早晨，${hero}开始了新一天。`,
    `第2页：${hero}遇到了一位新朋友，他们决定一起冒险。`,
    `第3页：他们互相帮助，解决了一个小难题。`,
    `第4页：傍晚时分，${hero}学会了勇敢与分享。`,
    `第5页：故事结束时，大家都笑着说“明天再见！”`
  ];
}

function drawBookIllustration(lines) {
  const palette = ['#ffd7ba', '#bde0fe', '#caffbf', '#ffadad', '#fdffb6'];
  bookCtx.clearRect(0, 0, bookCanvas.width, bookCanvas.height);
  bookCtx.fillStyle = '#fff7ec';
  bookCtx.fillRect(0, 0, bookCanvas.width, bookCanvas.height);

  lines.forEach((line, i) => {
    const x = 40 + i * 130;
    const y = 120 + (i % 2) * 30;

    bookCtx.fillStyle = palette[i % palette.length];
    bookCtx.beginPath();
    bookCtx.arc(x, y, 42, 0, Math.PI * 2);
    bookCtx.fill();

    bookCtx.fillStyle = '#4b3f72';
    bookCtx.font = '18px sans-serif';
    bookCtx.fillText(`P${i + 1}`, x - 14, y + 6);

    bookCtx.fillStyle = '#3f3d56';
    bookCtx.font = '14px sans-serif';
    bookCtx.fillText(line.slice(0, 10) + '…', x - 50, y + 72);
  });

  bookCtx.fillStyle = '#6750a4';
  bookCtx.font = 'bold 20px sans-serif';
  bookCtx.fillText('自动生成绘本插图（示意）', 20, 30);
}

function drawAudioEmotionArt(amplitudes) {
  audioCtx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
  audioCtx.fillStyle = '#eef7ff';
  audioCtx.fillRect(0, 0, audioCanvas.width, audioCanvas.height);

  audioCtx.strokeStyle = '#ff9800';
  audioCtx.lineWidth = 4;
  audioCtx.beginPath();

  amplitudes.forEach((amp, i) => {
    const x = (i / (amplitudes.length - 1)) * (audioCanvas.width - 40) + 20;
    const y = audioCanvas.height / 2 + amp * 110;
    if (i === 0) audioCtx.moveTo(x, y);
    else audioCtx.lineTo(x, y);
  });

  audioCtx.stroke();
  audioCtx.fillStyle = '#3f3d56';
  audioCtx.font = 'bold 20px sans-serif';
  audioCtx.fillText('声音情绪插图（示意波形）', 20, 30);
}

generateStoryBtn.addEventListener('click', () => {
  const sentence = storyPromptEl.value.trim();
  currentBook = generateBookFromSentence(sentence);
  storyOutputEl.textContent = currentBook.join('\n');
  bookArtBtn.disabled = false;
});

bookArtBtn.addEventListener('click', () => {
  if (!currentBook.length) return;
  drawBookIllustration(currentBook);
});

startRecordBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      playbackEl.src = URL.createObjectURL(blob);
      transcribeBtn.disabled = false;
      audioArtBtn.disabled = false;
    };

    mediaRecorder.start();
    startRecordBtn.disabled = true;
    stopRecordBtn.disabled = false;
  } catch {
    alert('无法访问麦克风，请检查浏览器权限。');
  }
});

stopRecordBtn.addEventListener('click', () => {
  if (!mediaRecorder) return;
  mediaRecorder.stop();
  startRecordBtn.disabled = false;
  stopRecordBtn.disabled = true;
});

transcribeBtn.addEventListener('click', () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    transcriptEl.value = '当前浏览器不支持实时语音识别，可接入服务端 ASR。';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'zh-CN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    transcriptEl.value = event.results[0][0].transcript;
  };

  recognition.onerror = () => {
    transcriptEl.value = '语音识别失败，请重试。';
  };

  recognition.start();
});

audioArtBtn.addEventListener('click', () => {
  const amplitudes = Array.from({ length: 60 }, () => (Math.random() - 0.5) * 1.2);
  drawAudioEmotionArt(amplitudes);
});

// Initial demo state
storyPromptEl.value = '小海豚想给森林里的朋友们讲海底故事';
currentBook = generateBookFromSentence(storyPromptEl.value);
storyOutputEl.textContent = currentBook.join('\n');
bookArtBtn.disabled = false;
drawBookIllustration(currentBook);
drawAudioEmotionArt(Array.from({ length: 60 }, (_, i) => Math.sin(i / 6) * 0.4));
