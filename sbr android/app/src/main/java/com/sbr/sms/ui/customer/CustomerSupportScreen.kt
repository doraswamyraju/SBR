package com.sbr.sms.ui.customer

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController

private data class FaqItem(val question: String, val answer: String)

private val faqItems = listOf(
    FaqItem(
        question = "How do I track my service agent?",
        answer = "You can track your agent in real-time using the 'Track Agent' button on the service detail page once your service request is in progress."
    ),
    FaqItem(
        question = "How do I make payments?",
        answer = "Payments can be made through UPI, credit/debit cards, or other available methods once a service is marked as complete by the agent."
    ),
    FaqItem(
        question = "Can I reschedule my service?",
        answer = "Yes, you can reschedule services up to 2 hours before the scheduled time by contacting our support team."
    )
)

@Composable
fun CustomerSupportScreen(navController: NavHostController) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        item {
            ContactOptionsSection()
        }
        item {
            FaqSection()
        }
    }
}

@Composable
private fun ContactOptionsSection() {
    val context = LocalContext.current
    val supportPhoneNumber = "18001234567" // Placeholder phone number
    val supportEmail = "support@SBR.com" // Placeholder email

    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        Text("Help & Support", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            "We're here to help you with any questions or issues.",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))

        // CHANGED: Cards are now in a Row for a side-by-side layout
        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            ContactOptionCard(
                icon = Icons.Default.Phone,
                title = "Call Support",
                subtitle = "Speak directly with our team",
                buttonText = "Call Now",
                onClick = {
                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$supportPhoneNumber"))
                    context.startActivity(intent)
                },
                modifier = Modifier.weight(1f)
            )
            ContactOptionCard(
                icon = Icons.Default.Chat,
                title = "Live Chat",
                subtitle = "Chat with our support agents",
                buttonText = "Start Chat",
                onClick = {
                    Toast.makeText(context, "Live Chat feature coming soon!", Toast.LENGTH_SHORT).show()
                },
                modifier = Modifier.weight(1f)
            )
            ContactOptionCard(
                icon = Icons.Default.Email,
                title = "Email Support",
                subtitle = "Send us your questions via email",
                buttonText = "Send Email",
                onClick = {
                    val intent = Intent(Intent.ACTION_SENDTO).apply {
                        data = Uri.parse("mailto:")
                        putExtra(Intent.EXTRA_EMAIL, arrayOf(supportEmail))
                        putExtra(Intent.EXTRA_SUBJECT, "Support Request - SBR App")
                    }
                    context.startActivity(Intent.createChooser(intent, "Send Email"))
                },
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun ContactOptionCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
    buttonText: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        // CHANGED: The content is now in a single Column and centered
        Column(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(32.dp), tint = MaterialTheme.colorScheme.primary)
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center, minLines = 2)
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = onClick) {
                Text(buttonText)
            }
        }
    }
}

@Composable
private fun FaqSection() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Frequently Asked Questions", style = MaterialTheme.typography.headlineSmall)
        faqItems.forEach { item ->
            FaqCard(question = item.question, answer = item.answer)
        }
    }
}

@Composable
private fun FaqCard(question: String, answer: String) {
    var isExpanded by remember { mutableStateOf(false) }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { isExpanded = !isExpanded }
            ) {
                Text(
                    text = question,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f)
                )
                // CHANGED: Icon now toggles between Add and Remove
                Icon(
                    imageVector = if (isExpanded) Icons.Default.Remove else Icons.Default.Add,
                    contentDescription = if (isExpanded) "Collapse" else "Expand"
                )
            }
            AnimatedVisibility(visible = isExpanded) {
                Column {
                    Divider(modifier = Modifier.padding(vertical = 12.dp))
                    Text(text = answer, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun CustomerSupportScreenPreview() {
    CustomerSupportScreen(navController = rememberNavController())
}