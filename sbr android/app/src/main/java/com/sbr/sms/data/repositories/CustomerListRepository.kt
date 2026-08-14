package com.sbr.sms.data.repositories

import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.api.CustomerListResponseDto
import com.sbr.sms.data.api.CustomerRecordDto
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

    suspend fun addCustomerRecord(record: CustomerRecordDto): Result<CustomerRecordDto> {
        return try {
            val response = apiService.addCustomerRecord(record)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to add customer record"))
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

    suspend fun clearCustomerList(): Result<Boolean> {
        return try {
            val response = apiService.clearCustomerList()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(true)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to clear customer list"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
