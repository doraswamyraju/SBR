// ui/common/InfoRow.kt
package com.sbr.sms.ui.common

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp // <-- Add this line

@Composable
fun InfoRow(label: String, value: String?) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Text("$label: ", modifier = Modifier.weight(1f))
        Text(value ?: "N/A", modifier = Modifier.weight(2f))
    }
}
