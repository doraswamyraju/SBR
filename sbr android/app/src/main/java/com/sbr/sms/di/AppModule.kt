package com.sbr.sms.di

import android.app.Application
import android.content.Context
// NEW: Import the CredentialManager
import com.sbr.sms.data.CredentialManager
import com.sbr.sms.data.repositories.*
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.api.AuthInterceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class AppModule {
    @Binds
    @Singleton
    abstract fun bindServiceRequestRepository(impl: ServiceRequestRepositoryImpl): ServiceRequestRepository

    @Binds
    @Singleton
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository

    @Binds
    @Singleton
    abstract fun bindStorageRepository(impl: StorageRepositoryImpl): StorageRepository
}

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    // Point to live production server on the VPS
    private const val BASE_URL = "https://sbr.sriddha.com/"

    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        loggingInterceptor: HttpLoggingInterceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}

@Module
@InstallIn(SingletonComponent::class)
object LocationModule {
    @Provides
    @Singleton
    fun provideFusedLocationProviderClient(application: Application): FusedLocationProviderClient {
        return LocationServices.getFusedLocationProviderClient(application)
    }
}

// NEW: A separate module for app-level data utilities like CredentialManager
@Module
@InstallIn(SingletonComponent::class)
object DataModule {
    @Provides
    @Singleton
    fun provideCredentialManager(@ApplicationContext context: Context): CredentialManager {
        return CredentialManager(context)
    }
}

@Module
@InstallIn(SingletonComponent::class)
object AuthBridgeModule {
    @Provides
    @Singleton
    fun provideFirebaseAuth(credentialManager: CredentialManager): com.google.firebase.auth.FirebaseAuth {
        return com.google.firebase.auth.FirebaseAuth(credentialManager)
    }
}