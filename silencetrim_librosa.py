import librosa
import soundfile as sf
import numpy as np

y, sr = librosa.load('silencetrim.ogg')
intervals = librosa.effects.split(y, top_db=30)  # Detect non-silence
non_silent = np.concatenate([y[i[0]:i[1]] for i in intervals])
sf.write('output.mp3', non_silent, sr)
