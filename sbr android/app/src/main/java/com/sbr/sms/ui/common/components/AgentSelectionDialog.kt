package com.sbr.sms.ui.common.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.sbr.sms.data.models.User

@Composable
fun AgentSelectionDialog(
    agents: List<User>,
    onDismiss: () -> Unit,
    onAgentSelected: (String) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Agent") },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                agents.forEach { agent ->
                    TextButton(
                        onClick = { onAgentSelected(agent.id) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(agent.name)
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
