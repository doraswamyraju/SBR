import SwiftUI

struct JobTimerView: View {
    let request: ServiceRequest
    
    @State private var elapsed: String = "00:00:00"
    @State private var timerLabel: String = "Time Elapsed"
    
    private let timer = Timer.publish(every: 1.0, on: .main, in: .common).autoconnect()
    
    var body: some View {
        if shouldShowTimer {
            HStack(spacing: 16) {
                Image(systemName: "timer")
                    .font(.system(size: 32))
                    .foregroundColor(SBRColors.primaryBlue)
                    .frame(width: 40, height: 40)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(elapsed)
                        .font(.title2)
                        .fontWeight(.bold)
                        .fontDesign(.monospaced)
                    
                    Text(timerLabel)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .frame(maxWidth: .infinity)
            .background(Color.white)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.gray.opacity(0.12), lineWidth: 1)
            )
            .onAppear {
                updateTimer()
            }
            .onReceive(timer) { _ in
                updateTimer()
            }
        }
    }
    
    private var shouldShowTimer: Bool {
        request.status != .pending && request.status != .assigned && request.status != .cancelled
    }
    
    private func updateTimer() {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let acceptedStr = request.acceptedAt,
              let acceptedDate = formatter.date(from: acceptedStr) else {
            elapsed = "00:00:00"
            return
        }
        
        if request.status == .accepted || request.status == .inProgress {
            timerLabel = "Time Elapsed"
            let diff = Date().timeIntervalSince(acceptedDate)
            elapsed = formatTimeInterval(diff)
        } else if request.status == .completed {
            timerLabel = "Total Job Duration"
            if let completedStr = request.completedAt,
               let completedDate = formatter.date(from: completedStr) {
                let diff = completedDate.timeIntervalSince(acceptedDate)
                elapsed = formatTimeInterval(diff)
            } else if let updatedDate = formatter.date(from: request.updatedAt) {
                // Fallback to updatedAt if completedAt is missing but status is completed
                let diff = updatedDate.timeIntervalSince(acceptedDate)
                elapsed = formatTimeInterval(diff)
            } else {
                elapsed = "00:00:00"
            }
        } else {
            // Display static total duration if completed or paid
            timerLabel = "Total Job Duration"
            if let completedStr = request.completedAt,
               let completedDate = formatter.date(from: completedStr) {
                let diff = completedDate.timeIntervalSince(acceptedDate)
                elapsed = formatTimeInterval(diff)
            } else if let paymentStr = request.paymentTimestamp,
                      let paymentDate = formatter.date(from: paymentStr) {
                let diff = paymentDate.timeIntervalSince(acceptedDate)
                elapsed = formatTimeInterval(diff)
            } else if let updatedDate = formatter.date(from: request.updatedAt) {
                let diff = updatedDate.timeIntervalSince(acceptedDate)
                elapsed = formatTimeInterval(diff)
            } else {
                elapsed = "00:00:00"
            }
        }
    }
    
    private func formatTimeInterval(_ interval: TimeInterval) -> String {
        let totalSeconds = Int(max(0, interval))
        let seconds = totalSeconds % 60
        let minutes = (totalSeconds / 60) % 60
        let hours = totalSeconds / 3600
        return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
    }
}
