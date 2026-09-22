package org.example.view;

import org.example.model.enums.SoundType;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.SourceDataLine;
import java.util.Random;

public final class SoundEffects {
    private static boolean soundEnabled = true;
    private static volatile boolean menuMusicPlaying;
    private static Thread menuMusicThread;
    private static SourceDataLine menuMusicLine;

    public static void setSoundEnabled(boolean enabled) {
        soundEnabled = enabled;
        if (!enabled) {
            stopMenuMusic();
        }
    }

    public static boolean isSoundEnabled() {
        return soundEnabled;
    }

    public static synchronized void startMenuMusic() {
        if (!soundEnabled || menuMusicPlaying) return;

        menuMusicPlaying = true;
        menuMusicThread = new Thread(() -> {
            try {
                float sampleRate = 8000f;
                AudioFormat format = new AudioFormat(sampleRate, 8, 1, true, false);
                SourceDataLine line = AudioSystem.getSourceDataLine(format);
                line.open(format);
                line.start();
                menuMusicLine = line;

                double[] melody = {
                        261.63, 329.63, 392.00, 523.25,
                        392.00, 329.63, 293.66, 261.63,
                        220.00, 261.63, 329.63, 440.00,
                        329.63, 293.66, 261.63, 196.00
                };

                while (menuMusicPlaying && !Thread.currentThread().isInterrupted()) {
                    for (double frequency : melody) {
                        if (!menuMusicPlaying || Thread.currentThread().isInterrupted()) break;

                        byte[] note = createNote(frequency, 0.18, sampleRate);
                        line.write(note, 0, note.length);
                    }
                }

                line.drain();
                line.stop();
                line.close();
            } catch (Exception ignored) {
            } finally {
                menuMusicLine = null;
                menuMusicPlaying = false;
            }
        }, "menu-music");
        menuMusicThread.setDaemon(true);
        menuMusicThread.start();
    }

    public static synchronized void stopMenuMusic() {
        menuMusicPlaying = false;

        if (menuMusicThread != null) {
            menuMusicThread.interrupt();
            menuMusicThread = null;
        }

        if (menuMusicLine != null) {
            menuMusicLine.stop();
            menuMusicLine.close();
            menuMusicLine = null;
        }
    }

    private static byte[] createNote(double frequency, double duration, float sampleRate) {
        int sampleCount = (int) (sampleRate * duration);
        byte[] samples = new byte[sampleCount];

        for (int i = 0; i < sampleCount; i++) {
            double time = i / sampleRate;
            double envelope = Math.min(1.0, i / 120.0)
                    * Math.min(1.0, (sampleCount - i) / 500.0);
            double squareWave = Math.sin(2 * Math.PI * frequency * time) >= 0 ? 1 : -1;
            samples[i] = (byte) (squareWave * 18 * envelope);
        }

        return samples;
    }

    public static void playSound(SoundType type) {
        if (!soundEnabled) return;

        new Thread(() -> {
            try {
                float sampleRate = 8000f;
                byte[] buf;
                AudioFormat af = new AudioFormat(sampleRate, 8, 1, true, false);
                SourceDataLine sdl = AudioSystem.getSourceDataLine(af);
                sdl.open(af);
                sdl.start();

                switch (type) {
                    case SHOOT:
                        buf = new byte[1200];
                        for (int i = 0; i < buf.length; i++) {
                            buf[i] = (byte) (Math.sin(i / 1.8) * (127 - i * (127.0 / buf.length)));
                        }
                        sdl.write(buf, 0, buf.length);
                        break;
                    case EXPLOSION:
                        buf = new byte[4000];
                        Random r = new Random();
                        for (int i = 0; i < buf.length; i++) {
                            buf[i] = (byte) ((r.nextDouble() * 2 - 1) * (127 - i * (127.0 / buf.length)));
                        }
                        sdl.write(buf, 0, buf.length);
                        break;
                    case POWER_UP:
                        buf = new byte[2500];
                        for (int i = 0; i < buf.length; i++) {
                            buf[i] = (byte) (Math.sin(i / (8.0 + i * 0.005)) * 90);
                        }
                        sdl.write(buf, 0, buf.length);
                        break;
                    default:
                        break;
                }
                sdl.drain();
                sdl.close();
            } catch (Exception ignored) {
            }
        }).start();
    }
}
