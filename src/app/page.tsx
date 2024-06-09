"use client";

import * as React from "react";
import Image from "next/image";
import Dropzone from "react-dropzone";
import imageCompression, { Options } from "browser-image-compression";

const useImageCompression = (options?: Options) => {
  const [compressedSingleImage, setCompressedSingleImage] =
    React.useState<File>();
  const [compressedMultipleImages, setCompressedMultipleImages] =
    React.useState<File[]>([]);

  const [isCompressingImage, setIsCompressingImage] = React.useState(false);
  const [isCompressingImages, setIsCompressingImages] = React.useState(false);

  const compressSingleImage = React.useCallback(
    async (imageFile: File) => {
      setIsCompressingImage(true);

      try {
        const compressedFile = await imageCompression(imageFile, {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg",
          ...options,
        });

        setCompressedSingleImage(compressedFile);
        setIsCompressingImage(false);
        return compressedFile;
      } catch (error) {
        // TODO: add toast
        console.error("Image compression failed:", error);
        setIsCompressingImage(false);
      }
    },
    [options]
  );

  const compressMultipleImages = React.useCallback(
    async (imageFiles: File[]) => {
      setIsCompressingImages(true);

      try {
        const compressedFiles = await Promise.all(
          imageFiles.map(async (file) => {
            const compressedFile = await compressSingleImage(file);
            return compressedFile;
          })
        );

        const filteredCompressedFiles = compressedFiles.filter(
          (file): file is File => file !== undefined
        );

        setCompressedMultipleImages(filteredCompressedFiles);
        setIsCompressingImages(false);

        return compressedFiles;
      } catch (error) {
        // TODO: add toast
        console.error("Multiple image compression failed:", error);
        setIsCompressingImages(false);
        return [];
      }
    },
    [compressSingleImage]
  );

  return {
    compressedSingleImage,
    compressedMultipleImages,
    compressSingleImage,
    compressMultipleImages,
    isCompressingImage,
    isCompressingImages,
  };
};

export default function Home() {
  const [imageFile, setImageFile] = React.useState<File>();
  const [imageFiles, setImageFiles] = React.useState<File[]>([]);

  const singleImageCompression = useImageCompression({
    fileType: "image/webp",
  });

  const multipleImageCompression = useImageCompression({
    fileType: "image/jpeg",
  });

  const handleImageUpload = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const imageFile = event.target.files?.[0];
      setImageFile(imageFile);

      if (imageFile) {
        const compressedFile = await singleImageCompression.compressSingleImage(
          imageFile
        );
        return compressedFile;
      }
    },
    [singleImageCompression]
  );

  const handleMultipleImageUpload = React.useCallback(
    async (acceptedFiles: File[]) => {
      setImageFiles(acceptedFiles);

      const compressedFiles =
        await multipleImageCompression.compressMultipleImages(acceptedFiles);

      return compressedFiles;
    },
    [multipleImageCompression]
  );

  return (
    <main className="bg-gray-400 min-h-dvh">
      <div className="flex justify-center items-center h-dvh bg-gray-500">
        <div className="bg-gray-400 p-6 space-y-6">
          <h1 className="text-white font-medium text-xl">Upload</h1>

          <div className="space-y-3">
            <input
              type="file"
              className="w-full"
              accept="image/*"
              onChange={handleImageUpload}
            />

            <div className="space-y-2">
              <p className="font-medium">
                original image size (
                {((imageFile?.size ?? 0) / 1000).toFixed(2)} KB){" "}
                {imageFile?.type}
              </p>

              <div className="w-96 h-48 flex justify-center items-center border border-gray-200">
                {imageFile ? (
                  <Image
                    src={URL.createObjectURL(imageFile)}
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="h-full w-full object-cover"
                    alt={`image file`}
                  />
                ) : (
                  <p className="text-gray-200">no image file</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium">
                compressed image size (
                {(
                  (singleImageCompression.compressedSingleImage?.size ?? 0) /
                  1000
                ).toFixed(2)}{" "}
                KB) {singleImageCompression.compressedSingleImage?.type}
              </p>

              {singleImageCompression.isCompressingImage && (
                <p className="text-gray-200">compressing...</p>
              )}

              <div className="w-96 h-48 flex justify-center items-center border border-gray-200">
                {singleImageCompression.compressedSingleImage && (
                  <Image
                    src={URL.createObjectURL(
                      singleImageCompression.compressedSingleImage
                    )}
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="h-full w-full object-cover"
                    alt={`compressed image file`}
                  />
                )}

                {!singleImageCompression.isCompressingImage &&
                  !singleImageCompression.compressedSingleImage && (
                    <p className="text-gray-200">no image file</p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center h-dvh bg-gray-600">
        <div className="bg-gray-400 p-6 space-y-6">
          <h1 className="text-white font-medium text-xl">Multiple Upload</h1>

          <div className="space-y-3">
            <div className="w-96 h-32 border border-gray-200">
              <Dropzone onDrop={handleMultipleImageUpload}>
                {({ getRootProps, getInputProps }) => (
                  <div
                    className="w-full h-full flex justify-center items-center"
                    {...getRootProps()}
                  >
                    <input {...getInputProps()} />

                    <p className="text-gray-200">
                      drag n drop or click to upload here
                    </p>
                  </div>
                )}
              </Dropzone>
            </div>

            <div className="space-y-2">
              <p className="font-medium">original image files</p>
              <div className="flex gap-2">
                {imageFiles.map((imageFile, imageFileIndex) => (
                  <div key={imageFileIndex} className="space-y-2">
                    <div className="w-36 h-36 flex justify-center items-center border border-gray-200">
                      <Image
                        src={URL.createObjectURL(imageFile)}
                        width={0}
                        height={0}
                        sizes="100vw"
                        className="h-full w-full object-cover"
                        alt={`image file`}
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="italic">type: {imageFile.type}</p>
                      <p className="italic">
                        size: {((imageFile.size ?? 0) / 1000).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                ))}

                {imageFiles.length === 0 && (
                  <p className="text-gray-200">no image file</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium">compressed image files</p>

              {multipleImageCompression.isCompressingImages && (
                <p className="text-gray-200">compressing...</p>
              )}

              <div className="flex gap-2">
                {multipleImageCompression.compressedMultipleImages.map(
                  (imageFile, imageFileIndex) => (
                    <div key={imageFileIndex} className="space-y-2">
                      <div className="w-36 h-36 flex justify-center items-center border border-gray-200">
                        <Image
                          src={URL.createObjectURL(imageFile)}
                          width={0}
                          height={0}
                          sizes="100vw"
                          className="h-full w-full object-cover"
                          alt={`image file`}
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="italic">type: {imageFile.type}</p>
                        <p className="italic">
                          size: {((imageFile.size ?? 0) / 1000).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  )
                )}

                {!multipleImageCompression.isCompressingImages &&
                  multipleImageCompression.compressedMultipleImages.length ===
                    0 && <p className="text-gray-200">no image file</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
