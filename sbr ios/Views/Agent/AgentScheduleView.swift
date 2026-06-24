import SwiftUI

struct AgentScheduleView: View {
    @State private var workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    @State private var startTime = Date()
    @State private var endTime = Date()
    @State private var autoAcceptJobs = false
    @State private var statusMessage = ""
    
    let daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    var body: some View {
        Form {
            Section(header: Text("Weekly Duty Shift").foregroundColor(.gray)) {
                ForEach(daysOfWeek, id: \.self) { day in
                    MultipleSelectionRow(title: day, isSelected: workingDays.contains(day)) {
                        if workingDays.contains(day) {
                            workingDays.removeAll(where: { $0 == day })
                        } else {
                            workingDays.append(day)
                        }
                    }
                }
            }
            
            Section(header: Text("Working Hours").foregroundColor(.gray)) {
                DatePicker("Start Shift", selection: $startTime, displayedComponents: .hourAndMinute)
                DatePicker("End Shift", selection: $endTime, displayedComponents: .hourAndMinute)
            }
            
            Section(header: Text("Job Preferences").foregroundColor(.gray)) {
                Toggle("Auto-Accept Nearby Service Requests", isOn: $autoAcceptJobs)
            }
            
            if !statusMessage.isEmpty {
                Section {
                    Text(statusMessage).foregroundColor(.green).font(.footnote)
                }
            }
            
            Section {
                Button(action: saveSchedule) {
                    HStack {
                        Spacer()
                        Text("Save Duty Schedule")
                            .fontWeight(.bold)
                        Spacer()
                    }
                }
                .foregroundColor(.indigo)
            }
        }
        .background(Color(red: 0.05, green: 0.05, blue: 0.08).ignoresSafeArea())
        .navigationTitle("Work Roster")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func saveSchedule() {
        statusMessage = "Availability schedule updated successfully!"
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            statusMessage = ""
        }
    }
}

struct MultipleSelectionRow: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Text(title).foregroundColor(.white)
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark").foregroundColor(.indigo)
                }
            }
        }
    }
}
