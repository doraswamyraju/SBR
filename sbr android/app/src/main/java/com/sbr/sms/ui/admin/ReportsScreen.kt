package com.sbr.sms.ui.admin

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.ui.admin.viewmodels.AgentPerformance
import com.sbr.sms.ui.admin.viewmodels.ReportsViewModel
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportsScreen(
    navController: NavHostController,
    viewModel: ReportsViewModel = hiltViewModel()
) {
    val reportsData by viewModel.reportsData.collectAsState()
    val selectedFilter by viewModel.selectedFilter.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val context = LocalContext.current

    val currencyFormatter = remember {
        NumberFormat.getCurrencyInstance(Locale("en", "IN")).apply {
            maximumFractionDigits = 0
        }
    }

    val filters = listOf("Today", "This Week", "This Month", "All Time")

    fun shareReportSummary() {
        val summaryText = """
            *Sri Balaji Renewables - Operations Report*
            Period: $selectedFilter
            ------------------------------------
            💰 Total Revenue: ${currencyFormatter.format(reportsData.totalRevenue)}
            💵 Cash Collections: ${currencyFormatter.format(reportsData.cashRevenue)}
            💳 Online / UPI: ${currencyFormatter.format(reportsData.onlineRevenue)}
            ------------------------------------
            📋 Total Tickets: ${reportsData.totalTickets}
            ✅ Completed: ${reportsData.completedTickets}
            ⏳ In Progress: ${reportsData.inProgressTickets}
            ⏱️ Pending: ${reportsData.pendingTickets}
            ⭐ Satisfaction Rate: ${String.format(Locale.US, "%.1f", reportsData.customerSatisfaction)}%
            ------------------------------------
            Generated automatically via SBR Admin Portal
        """.trimIndent()

        val sendIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, summaryText)
            type = "text/plain"
        }
        val shareIntent = Intent.createChooser(sendIntent, "Share Operations Report")
        context.startActivity(shareIntent)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Business Reports & Analytics") },
                actions = {
                    IconButton(onClick = { shareReportSummary() }) {
                        Icon(Icons.Default.Share, contentDescription = "Share Report", tint = MaterialTheme.colorScheme.onPrimary)
                    }
                    IconButton(onClick = { viewModel.loadReports() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = MaterialTheme.colorScheme.onPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Timeframe Filter Chips
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    filters.forEach { filter ->
                        FilterChip(
                            selected = selectedFilter == filter,
                            onClick = { viewModel.setFilter(filter) },
                            label = { Text(filter, fontWeight = FontWeight.SemiBold) }
                        )
                    }
                }
            }

            // 2. Revenue Overview Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Total Revenue ($selectedFilter)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            currencyFormatter.format(reportsData.totalRevenue),
                            fontSize = 30.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.2f))
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Cash Collections", fontSize = 11.sp, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f))
                                Text(currencyFormatter.format(reportsData.cashRevenue), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("Online / Digital", fontSize = 11.sp, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f))
                                Text(currencyFormatter.format(reportsData.onlineRevenue), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // 3. Service Ticket Funnel
            item {
                Text("Service Pipeline", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricBox(
                        title = "Completed",
                        count = reportsData.completedTickets.toString(),
                        color = Color(0xFF16A34A),
                        bgColor = Color(0xFFDCFCE7),
                        modifier = Modifier.weight(1f)
                    )
                    MetricBox(
                        title = "In Progress",
                        count = reportsData.inProgressTickets.toString(),
                        color = Color(0xFF0284C7),
                        bgColor = Color(0xFFE0F2FE),
                        modifier = Modifier.weight(1f)
                    )
                    MetricBox(
                        title = "Pending",
                        count = reportsData.pendingTickets.toString(),
                        color = Color(0xFFD97706),
                        bgColor = Color(0xFFFEF3C7),
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // 4. Quality & Satisfaction
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Customer Satisfaction Rate", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                            Text("Derived from Google Reviews & in-app feedback", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        }
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Color(0xFFDCFCE7)
                        ) {
                            Text(
                                "⭐ ${String.format(Locale.US, "%.1f", reportsData.customerSatisfaction)}%",
                                color = Color(0xFF15803D),
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }

            // 5. Service Type Distribution
            if (reportsData.serviceTypeCounts.isNotEmpty()) {
                item {
                    Text("Service Demand Breakdown", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            reportsData.serviceTypeCounts.forEach { (type, count) ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(type, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = MaterialTheme.colorScheme.secondaryContainer
                                    ) {
                                        Text(
                                            "$count tickets",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                                HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
                            }
                        }
                    }
                }
            }

            // 6. Top Technicians Leaderboard
            item {
                Text("Technician Performance Leaderboard", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }

            if (reportsData.topAgents.isEmpty()) {
                item {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Text("No active technician performance logged yet.", modifier = Modifier.padding(16.dp), color = Color.Gray)
                    }
                }
            } else {
                itemsIndexed(reportsData.topAgents) { index, agent ->
                    TechnicianLeaderboardCard(
                        rank = index + 1,
                        agent = agent,
                        currencyFormatter = currencyFormatter
                    )
                }
            }
        }
    }
}

@Composable
fun MetricBox(
    title: String,
    count: String,
    color: Color,
    bgColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = bgColor
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(count, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = color)
            Spacer(modifier = Modifier.height(2.dp))
            Text(title, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = color)
        }
    }
}

@Composable
fun TechnicianLeaderboardCard(
    rank: Int,
    agent: AgentPerformance,
    currencyFormatter: NumberFormat
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(
                        when (rank) {
                            1 -> Color(0xFFFEF3C7)
                            2 -> Color(0xFFF1F5F9)
                            3 -> Color(0xFFFFEDD5)
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "#$rank",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = when (rank) {
                        1 -> Color(0xFFD97706)
                        2 -> Color(0xFF475569)
                        3 -> Color(0xFFEA580C)
                        else -> Color.Gray
                    }
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(agent.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Text("⭐ ${String.format(Locale.US, "%.1f", agent.rating)} • ${agent.completedJobs} completed jobs", fontSize = 12.sp, color = Color.Gray)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(currencyFormatter.format(agent.totalRevenue), fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
                Text("Collected", fontSize = 10.sp, color = Color.Gray)
            }
        }
    }
}
