package com.sbr.sms.ui.admin.viewmodels

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.provider.MediaStore
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

data class PaymentInfo(
    val request: ServiceRequest,
    val agent: Agent?,
    val customer: Customer?
)

data class PaymentStats(
    val totalRevenue: Double = 0.0,
    val todaysCollections: Double = 0.0
)

sealed interface AdminPaymentsUiState {
    object Loading : AdminPaymentsUiState
    data class Success(
        val stats: PaymentStats,
        val transactions: List<PaymentInfo>
    ) : AdminPaymentsUiState
    data class Error(val message: String) : AdminPaymentsUiState
}

@HiltViewModel
@OptIn(ExperimentalCoroutinesApi::class)
class AdminPaymentsViewModel @Inject constructor(
    private val serviceRequestRepository: ServiceRequestRepository,
    private val userRepository: UserRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    val uiState: StateFlow<AdminPaymentsUiState> =
        serviceRequestRepository.getPaidRequestsStream()
            .flatMapLatest { paidRequests ->
                if (paidRequests.isEmpty()) {
                    return@flatMapLatest flowOf(AdminPaymentsUiState.Success(PaymentStats(), emptyList()) as AdminPaymentsUiState)
                }

                val userIds = (paidRequests.mapNotNull { it.assignedAgentId } +
                        paidRequests.map { it.customerId }).distinct()

                userRepository.getUsersByIds(userIds).map { users ->
                    val usersMap = users.associateBy { it.id }

                    val transactions = paidRequests.map { request ->
                        PaymentInfo(
                            request = request,
                            agent = usersMap[request.assignedAgentId] as? Agent,
                            customer = usersMap[request.customerId] as? Customer
                        )
                    }

                    val totalRevenue = paidRequests.sumOf { it.paymentAmount ?: 0.0 }
                    val todaysCollections = paidRequests.filter {
                        it.paymentTimestamp?.let { timestamp ->
                            val cal = Calendar.getInstance()
                            val todayStart = cal.apply { set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0) }.time
                            val todayEnd = cal.apply { set(Calendar.HOUR_OF_DAY, 23); set(Calendar.MINUTE, 59); set(Calendar.SECOND, 59) }.time
                            timestamp.after(todayStart) && timestamp.before(todayEnd)
                        } ?: false
                    }.sumOf { it.paymentAmount ?: 0.0 }


                    val stats = PaymentStats(
                        totalRevenue = totalRevenue,
                        todaysCollections = todaysCollections
                    )
                    AdminPaymentsUiState.Success(stats, transactions) as AdminPaymentsUiState
                }
            }
            .catch { e -> emit(AdminPaymentsUiState.Error(e.message ?: "An error occurred")) }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = AdminPaymentsUiState.Loading
            )


    fun exportTransactions(
        startDate: Date,
        endDate: Date,
        onComplete: (Boolean, String) -> Unit
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val requests = serviceRequestRepository.getPaidRequestsInDateRange(startDate, endDate)
                if (requests.isEmpty()) {
                    // FIXED: Switch to the main thread before showing the Toast
                    withContext(Dispatchers.Main) {
                        onComplete(false, "No transactions found in the selected date range.")
                    }
                    return@launch
                }

                val userIds = (requests.mapNotNull { it.assignedAgentId } + requests.map { it.customerId }).distinct()
                val users = userRepository.getUsersByIds(userIds).first()
                val usersMap = users.associateBy { it.id }

                val csvHeader = "Transaction ID,Date,Agent Name,Customer Name,Amount,Payment Method\n"
                val csvContent = StringBuilder(csvHeader)
                val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())

                requests.forEach { request ->
                    val agentName = (usersMap[request.assignedAgentId] as? Agent)?.name ?: "N/A"
                    val customerName = (usersMap[request.customerId] as? Customer)?.name ?: "N/A"
                    val date = request.paymentTimestamp?.let { dateFormat.format(it) } ?: "N/A"
                    val amount = request.paymentAmount ?: 0.0
                    val method = request.paymentMethod ?: "N/A"
                    csvContent.append("\"${request.id}\",\"$date\",\"$agentName\",\"$customerName\",$amount,\"$method\"\n")
                }

                saveCsvToFile(csvContent.toString())
                // FIXED: Switch to the main thread before showing the Toast
                withContext(Dispatchers.Main) {
                    onComplete(true, "Export successful! Saved to Downloads.")
                }

            } catch (e: Exception) {
                // FIXED: Switch to the main thread before showing the Toast
                withContext(Dispatchers.Main) {
                    onComplete(false, "Export failed: ${e.message}")
                }
            }
        }
    }

    private fun saveCsvToFile(csvContent: String) {
        val fileName = "payment_export_${System.currentTimeMillis()}.csv"
        val contentResolver = context.contentResolver
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, "text/csv")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.MediaColumns.RELATIVE_PATH, "Download/SBRApp")
            }
        }

        val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            MediaStore.Downloads.EXTERNAL_CONTENT_URI
        } else {
            MediaStore.Files.getContentUri("external")
        }

        val fileUri = contentResolver.insert(collection, contentValues)

        fileUri?.let {
            contentResolver.openOutputStream(it).use { outputStream ->
                outputStream?.write(csvContent.toByteArray())
            }
        } ?: throw Exception("Failed to create file using MediaStore.")
    }
}