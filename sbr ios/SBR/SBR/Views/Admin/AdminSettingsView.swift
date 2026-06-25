import SwiftUI

struct AdminSettingsView: View {
    @ObservedObject var requestVM: RequestViewModel
    @State private var reviewUrl = ""
    @State private var isLoading = false
    @State private var statusMessage = ""
    @State private var statusColor = Color.green
    
    var body: some View {
        VStack(spacing: 20) {
            Form {
                Section(header: Text("Review URL Configuration").foregroundColor(.gray)) {
                    TextField("Enter Google Review URL", text: $reviewUrl)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .keyboardType(.URL)
                }
                
                Section {
                    Button(action: saveSettings) {
                        HStack {
                            Spacer()
                            if isLoading {
                                ProgressView()
                            } else {
                                Text("Save Settings")
                                    .fontWeight(.bold)
                            }
                            Spacer()
                        }
                    }
                    .foregroundColor(SBRColors.primaryBlue)
                    .disabled(isLoading || reviewUrl.isEmpty)
                }
                
                if !statusMessage.isEmpty {
                    Section {
                        Text(statusMessage)
                            .foregroundColor(statusColor)
                            .font(.footnote)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
            }
        }
        .background(SBRColors.background.ignoresSafeArea())
        .onAppear(perform: loadSettings)
    }
    
    private func loadSettings() {
        isLoading = true
        Task {
            struct SettingsResponse: Decodable {
                let success: Bool
                let data: [String: String]
            }
            do {
                let res = try await APIClient.shared.get(endpoint: "api/settings", responseType: SettingsResponse.self)
                isLoading = false
                if res.success, let url = res.data["reviewUrl"] {
                    self.reviewUrl = url
                }
            } catch {
                isLoading = false
            }
        }
    }
    
    private func saveSettings() {
        isLoading = true
        statusMessage = ""
        Task {
            struct SaveResponse: Decodable {
                let success: Bool
            }
            let body = ["key": "reviewUrl", "value": reviewUrl]
            do {
                let res = try await APIClient.shared.put(endpoint: "api/settings", body: body, responseType: SaveResponse.self)
                isLoading = false
                if res.success {
                    statusColor = .green
                    statusMessage = "Settings saved successfully!"
                } else {
                    statusColor = .red
                    statusMessage = "Failed to save settings."
                }
            } catch {
                isLoading = false
                statusColor = .red
                statusMessage = error.localizedDescription
            }
        }
    }
}
