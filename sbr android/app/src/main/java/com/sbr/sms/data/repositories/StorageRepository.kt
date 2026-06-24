package com.sbr.sms.data.repositories

import android.net.Uri

interface StorageRepository {
    /**
     * Uploads a profile image for a given user and returns the download URL.
     */
    suspend fun uploadProfileImage(userId: String, imageUri: Uri): String

    /**
     * Uploads an image for a service request and returns the download URL.
     */
    suspend fun uploadRequestImage(requestId: String, imageType: String, imageUri: Uri): String
}