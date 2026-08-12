package com.sbr.sms.data.repositories

import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.api.CustomerListResponseDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CustomerListRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getCustomerList(search: String? = null, product: String? = null): Result<CustomerListResponseDto> {
        return try {
            val response = apiService.getCustomerList(search, product)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch customer list"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteCustomerRecord(id: String): Result<Boolean> {
        return try {
            val response = apiService.deleteCustomerRecord(id)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(true)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to delete record"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
