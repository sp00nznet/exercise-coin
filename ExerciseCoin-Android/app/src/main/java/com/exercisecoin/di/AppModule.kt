package com.exercisecoin.di

import android.content.Context
import com.exercisecoin.core.network.ApiClient
import com.exercisecoin.core.network.ApiService
import com.exercisecoin.core.storage.TokenManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideTokenManager(
        @ApplicationContext context: Context
    ): TokenManager {
        return TokenManager(context)
    }

    @Provides
    @Singleton
    fun provideApiClient(
        tokenManager: TokenManager
    ): ApiClient {
        return ApiClient(tokenManager)
    }

    @Provides
    @Singleton
    fun provideApiService(
        apiClient: ApiClient
    ): ApiService {
        return apiClient.apiService
    }
}
