import numpy as np
import cv2

NEW_COLOR = .4

img = cv2.imread('kaggle_original.jpg', cv2.IMREAD_GRAYSCALE)

img = np.where(img < 100, NEW_COLOR, 1.)

new = np.zeros(shape=(len(img), len(img[0]), 3))
for i, value in np.ndenumerate(img):
    new[i] = [value * 255] * 3

cv2.imwrite('kaggle.jpg', new)

img = cv2.imread('github_original.png', cv2.IMREAD_GRAYSCALE)

img = np.where(img < 210, NEW_COLOR, 1.)

new = np.zeros(shape=(len(img), len(img[0]), 3))
for i, value in np.ndenumerate(img):
    new[i] = [value * 255] * 3

cv2.imwrite('github.jpg', new)

img = cv2.imread('linkedin_original.png', cv2.IMREAD_GRAYSCALE)

img = np.where(img < 210, NEW_COLOR, 1.)

new = np.zeros(shape=(len(img), len(img[0]), 3))
for i, value in np.ndenumerate(img):
    new[i] = [value * 255] * 3

cv2.imwrite('linkedin.jpg', new)
