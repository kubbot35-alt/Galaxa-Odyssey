package org.example.view;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;

public final class ResourceLoader {
    private ResourceLoader() {
    }

    public static BufferedImage loadImage(String resourcePath) {
        String normalizedPath = resourcePath.startsWith("/")
                ? resourcePath
                : "/" + resourcePath;

        try (InputStream inputStream = ResourceLoader.class.getResourceAsStream(normalizedPath)) {
            if (inputStream == null) {
                throw new IllegalArgumentException("Resource not found: " + normalizedPath);
            }
            return ImageIO.read(inputStream);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not load image resource: " + normalizedPath, exception);
        }
    }
}
