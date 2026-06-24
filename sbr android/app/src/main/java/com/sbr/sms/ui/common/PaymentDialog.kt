// ui/common/PaymentDialog.kt
package com.sbr.sms.ui.common

import androidx.compose.material3.*
import androidx.compose.runtime.*

@Composable
fun PaymentDialog(
    onDismiss: () -> Unit,
    onSubmit: (amount: String) -> Unit
) {
    var amount by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Update Payment Status") },
        text = {
            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it },
                label = { Text("Amount") }
            )
        },
        confirmButton = {
            Button(
                onClick = {
                    onSubmit(amount)
                    onDismiss()
                },
                enabled = amount.isNotBlank()
            ) { Text("Submit") }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
