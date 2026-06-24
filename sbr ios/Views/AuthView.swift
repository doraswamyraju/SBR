import SwiftUI

struct AuthView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var isLogin = true
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var phone = ""
    @State private var selectedRole: UserRole = .customer
    
    var body: some View {
        ZStack {
            // Dark gradient background matching our premium design system
            LinearGradient(gradient: Gradient(colors: [Color(red: 0.08, green: 0.08, blue: 0.12), Color(red: 0.04, green: 0.04, blue: 0.06)]), startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 25) {
                    Spacer().frame(height: 40)
                    
                    // Brand Identity
                    VStack(spacing: 8) {
                        Image(systemName: "bolt.shield")
                            .font(.system(size: 60))
                            .foregroundColor(.indigo)
                            .shadow(color: .indigo.opacity(0.5), radius: 10)
                        
                        Text("Sri Balaji Renewables")
                            .font(.title)
                            .fontWeight(.heavy)
                            .foregroundColor(.white)
                        
                        Text("MERN iOS Control Portal")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    
                    // Auth Segment Control Tab
                    HStack {
                        Button(action: { isLogin = true }) {
                            VStack {
                                Text("Login")
                                    .fontWeight(.bold)
                                    .foregroundColor(isLogin ? .indigo : .gray)
                                Rectangle()
                                    .fill(isLogin ? Color.indigo : Color.clear)
                                    .frame(height: 2)
                            }
                        }
                        
                        Button(action: { isLogin = false }) {
                            VStack {
                                Text("Register")
                                    .fontWeight(.bold)
                                    .foregroundColor(!isLogin ? .indigo : .gray)
                                Rectangle()
                                    .fill(!isLogin ? Color.indigo : Color.clear)
                                    .frame(height: 2)
                            }
                        }
                    }
                    .frame(height: 45)
                    .padding(.horizontal)
                    
                    // Form Fields
                    VStack(spacing: 16) {
                        if !isLogin {
                            CustomTextField(icon: "user", placeholder: "Full Name", text: $name)
                        }
                        
                        CustomTextField(icon: "envelope", placeholder: "Email Address", text: $email)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                        
                        CustomSecureField(placeholder: "Password", text: $password)
                        
                        if !isLogin {
                            CustomTextField(icon: "phone", placeholder: "Phone Number", text: $phone)
                                .keyboardType(.phonePad)
                            
                            // Role Picker
                            VStack(alignment: .leading, spacing: 5) {
                                Text("Register As")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                Picker("Role", selection: $selectedRole) {
                                    Text("Customer / Client").tag(UserRole.customer)
                                    Text("Service Agent").tag(UserRole.agent)
                                }
                                .pickerStyle(SegmentedPickerStyle())
                            }
                            .padding(.top, 5)
                        }
                    }
                    .padding(24)
                    .background(Color.white.opacity(0.03))
                    .cornerRadius(16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.06), lineWidth: 1)
                    )
                    
                    if let error = authVM.errorMessage {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.footnote)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    
                    // Action Button
                    Button(action: {
                        Task {
                            if isLogin {
                                await authVM.login(email: email, password: password)
                            } else {
                                await authVM.register(name: name, email: email, password: password, role: selectedRole, phone: phone)
                            }
                        }
                    }) {
                        HStack {
                            Spacer()
                            if authVM.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text(isLogin ? "Sign In" : "Create Account")
                                    .fontWeight(.bold)
                            }
                            Spacer()
                        }
                        .padding()
                        .background(LinearGradient(gradient: Gradient(colors: [Color.indigo, Color.purple]), startPoint: .leading, endPoint: .trailing))
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .shadow(color: .indigo.opacity(0.3), radius: 5, y: 3)
                    }
                    .disabled(authVM.isLoading)
                    
                    Spacer()
                }
                .padding(.horizontal, 20)
            }
        }
    }
}

// Custom text field with background matching glass design
struct CustomTextField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: icon == "user" ? "person.fill" : (icon == "envelope" ? "envelope.fill" : "phone.fill"))
                .foregroundColor(.gray)
                .frame(width: 20)
            TextField("", text: $text, prompt: Text(placeholder).foregroundColor(.gray))
                .foregroundColor(.white)
        }
        .padding()
        .background(Color.black.opacity(0.2))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}

struct CustomSecureField: View {
    let placeholder: String
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: "lock.fill")
                .foregroundColor(.gray)
                .frame(width: 20)
            SecureField("", text: $text, prompt: Text(placeholder).foregroundColor(.gray))
                .foregroundColor(.white)
        }
        .padding()
        .background(Color.black.opacity(0.2))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}
