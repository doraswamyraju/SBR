package com.sbr.sms.ui.common

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.media.ExifInterface
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

object ImageCompressorHelper {

    suspend fun compressAndPrepareMultipart(
        context: Context,
        imageUri: Uri,
        paramName: String = "file"
    ): MultipartBody.Part? = withContext(Dispatchers.IO) {
        try {
            val inputStream: InputStream? = context.contentResolver.openInputStream(imageUri)
            val originalBitmap = BitmapFactory.decodeStream(inputStream) ?: return@withContext null
            inputStream?.close()

            // Rotate based on EXIF if needed
            val rotatedBitmap = rotateImageIfRequired(context, originalBitmap, imageUri)

            // Resize if too large
            val maxDimension = 1280
            val scaledBitmap = scaleBitmap(rotatedBitmap, maxDimension)

            // Compress to JPEG file
            val tempFile = File(context.cacheDir, "upload_${System.currentTimeMillis()}.jpg")
            val outputStream = FileOutputStream(tempFile)
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
            outputStream.flush()
            outputStream.close()

            val requestFile = tempFile.asRequestBody("image/jpeg".toMediaTypeOrNull())
            MultipartBody.Part.createFormData(paramName, tempFile.name, requestFile)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun scaleBitmap(bitmap: Bitmap, maxDimension: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        if (width <= maxDimension && height <= maxDimension) return bitmap

        val ratio = width.toFloat() / height.toFloat()
        val targetWidth: Int
        val targetHeight: Int
        if (ratio > 1) {
            targetWidth = maxDimension
            targetHeight = (maxDimension / ratio).toInt()
        } else {
            targetHeight = maxDimension
            targetWidth = (maxDimension * ratio).toInt()
        }
        return Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
    }

    private fun rotateImageIfRequired(context: Context, img: Bitmap, selectedImage: Uri): Bitmap {
        return try {
            val input = context.contentResolver.openInputStream(selectedImage) ?: return img
            val ei = ExifInterface(input)
            val orientation = ei.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
            input.close()
            when (orientation) {
                ExifInterface.ORIENTATION_ROTATE_90 -> rotateImage(img, 90f)
                ExifInterface.ORIENTATION_ROTATE_180 -> rotateImage(img, 180f)
                ExifInterface.ORIENTATION_ROTATE_270 -> rotateImage(img, 270f)
                else -> img
            }
        } catch (e: Exception) {
            img
        }
    }

    private fun rotateImage(img: Bitmap, degree: Float): Bitmap {
        val matrix = Matrix()
        matrix.postRotate(degree)
        val rotatedImg = Bitmap.createBitmap(img, 0, 0, img.width, img.height, matrix, true)
        img.recycle()
        return rotatedImg
    }
}
