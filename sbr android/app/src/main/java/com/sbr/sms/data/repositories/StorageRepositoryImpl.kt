package com.sbr.sms.data.repositories

import android.content.Context
import android.net.Uri
import android.util.Log
import com.sbr.sms.data.api.ApiService
import dagger.hilt.android.qualifiers.ApplicationContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StorageRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: ApiService
) : StorageRepository {

    private val tag = "StorageRepository"

    private fun uriToMultipart(imageUri: Uri, fieldName: String): MultipartBody.Part? {
        return try {
            val contentResolver = context.contentResolver
            val inputStream = contentResolver.openInputStream(imageUri) ?: return null
            val mimeType = contentResolver.getType(imageUri) ?: "image/jpeg"
            val bytes = inputStream.use { it.readBytes() }

            val requestBody = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
            
            val extension = when (mimeType) {
                "image/png" -> ".png"
                "image/gif" -> ".gif"
                else -> ".jpg"
            }
            val filename = "upload_${System.currentTimeMillis()}$extension"

            MultipartBody.Part.createFormData(fieldName, filename, requestBody)
        } catch (e: Exception) {
            Log.e(tag, "Error converting uri $imageUri to multipart", e)
            null
        }
    }

    override suspend fun uploadProfileImage(userId: String, imageUri: Uri): String {
        try {
            val part = uriToMultipart(imageUri, "image") ?: throw Exception("Failed to open file stream")
            val response = apiService.uploadImage(part)
            if (response.isSuccessful) {
                return response.body()?.url ?: ""
            } else {
                throw Exception("Upload failed: ${response.errorBody()?.string()}")
            }
        } catch (e: Exception) {
            Log.e(tag, "Error uploading profile image for user $userId", e)
            throw e
        }
    }

    override suspend fun uploadRequestImage(requestId: String, imageType: String, imageUri: Uri): String {
        try {
            val part = uriToMultipart(imageUri, "image") ?: throw Exception("Failed to open file stream")
            val response = apiService.uploadImage(part)
            if (response.isSuccessful) {
                return response.body()?.url ?: ""
            } else {
                throw Exception("Upload failed: ${response.errorBody()?.string()}")
            }
        } catch (e: Exception) {
            Log.e(tag, "Error uploading request image for request $requestId ($imageType)", e)
            throw e
        }
    }
}