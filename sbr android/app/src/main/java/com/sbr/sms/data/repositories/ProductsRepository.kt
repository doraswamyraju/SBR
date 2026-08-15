package com.sbr.sms.data.repositories

import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.api.ProductDto
import com.sbr.sms.data.api.ProductRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProductsRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getProducts(activeOnly: Boolean = false, category: String? = null): Result<List<ProductDto>> {
        return try {
            val response = apiService.getProducts(activeOnly, if (category == "All") null else category)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to fetch products"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createProduct(product: ProductRequest): Result<ProductDto> {
        return try {
            val response = apiService.createProduct(product)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to create product"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateProduct(id: String, product: ProductRequest): Result<ProductDto> {
        return try {
            val response = apiService.updateProduct(id, product)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to update product"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteProduct(id: String): Result<Boolean> {
        return try {
            val response = apiService.deleteProduct(id)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(true)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to delete product"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
