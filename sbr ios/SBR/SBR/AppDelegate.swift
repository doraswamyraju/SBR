import UIKit
import FirebaseCore
import FirebaseMessaging
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Initialize Firebase (fails gracefully if GoogleService-Info.plist is missing in development)
        if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
           let _ = NSDictionary(contentsOfFile: path) {
            FirebaseApp.configure()
            Messaging.messaging().delegate = self
        } else {
            print("Notice: GoogleService-Info.plist not found. Firebase notifications will run in mock local mode.")
        }
        
        // Set notification delegate
        UNUserNotificationCenter.current().delegate = self
        
        // Request authorization for push notifications
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(options: authOptions) { granted, error in
            if let error = error {
                print("Notification permission error: \(error.localizedDescription)")
            } else {
                print("Notification permission status: \(granted)")
            }
        }
        
        application.registerForRemoteNotifications()
        return true
    }
    
    // APNs registration success
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }
    
    // Receive FCM token updates
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        print("Refreshed FCM Token: \(token)")
        UserDefaults.standard.set(token, forKey: "fcm_token")
        
        // If user is already authenticated, upload the new token to backend
        if APIClient.shared.getToken() != nil {
            Task {
                do {
                    struct FCMTokenPayload: Encodable {
                        let fcmToken: String
                    }
                    struct FCMTokenResponse: Decodable {
                        let success: Bool
                    }
                    _ = try await APIClient.shared.post(
                        endpoint: "api/users/fcm-token",
                        body: FCMTokenPayload(fcmToken: token),
                        responseType: FCMTokenResponse.self
                    )
                    print("Successfully updated FCM token on server from AppDelegate.")
                } catch {
                    print("Failed to update FCM token on server from AppDelegate: \(error.localizedDescription)")
                }
            }
        }
    }
    
    // Handle foreground notifications
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([[.banner, .sound, .badge]])
    }
    
    // Handle tap on notifications
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        print("Notification tapped: \(userInfo)")
        completionHandler()
    }
}
