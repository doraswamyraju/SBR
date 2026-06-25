import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case serializationError(String)
    case responseError(String)
    case unauthorized
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .serializationError(let details):
            return "Failed to parse data from server: \(details)"
        case .responseError(let message):
            return message
        case .unauthorized:
            return "Session expired. Please log in again."
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

class APIClient {
    static let shared = APIClient()
    private let baseURL = "https://sbr.sriddha.com" // Point to live production server on the VPS
    
    private init() {}
    
    // Save token to UserDefaults
    func saveToken(_ token: String) {
        UserDefaults.standard.set(token, forKey: "auth_token")
    }
    
    // Get token from UserDefaults
    func getToken() -> String? {
        UserDefaults.standard.string(forKey: "auth_token")
    }
    
    // Clear token on logout
    func clearToken() {
        UserDefaults.standard.removeObject(forKey: "auth_token")
        UserDefaults.standard.removeObject(forKey: "auth_user")
    }
    
    // Prepare request with authentication headers
    private func prepareRequest(urlPath: String, method: String) -> URLRequest? {
        guard let url = URL(string: "\(baseURL)/\(urlPath)") else { return nil }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return request
    }
    
    // GET Request
    func get<T: Decodable>(endpoint: String, responseType: T.Type) async throws -> T {
        guard var request = prepareRequest(urlPath: endpoint, method: "GET") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        return try handleResponse(data: data, response: response, type: responseType)
    }
    
    // POST Request
    func post<T: Decodable, B: Encodable>(endpoint: String, body: B, responseType: T.Type) async throws -> T {
        guard var request = prepareRequest(urlPath: endpoint, method: "POST") else {
            throw APIError.invalidURL
        }
        
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        return try handleResponse(data: data, response: response, type: responseType)
    }
    
    // PUT Request
    func put<T: Decodable, B: Encodable>(endpoint: String, body: B, responseType: T.Type) async throws -> T {
        guard var request = prepareRequest(urlPath: endpoint, method: "PUT") else {
            throw APIError.invalidURL
        }
        
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        return try handleResponse(data: data, response: response, type: responseType)
    }
    
    // DELETE Request
    func delete<T: Decodable>(endpoint: String, responseType: T.Type) async throws -> T {
        guard var request = prepareRequest(urlPath: endpoint, method: "DELETE") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        return try handleResponse(data: data, response: response, type: responseType)
    }
    
    // Multi-part image upload to VPS static folder
    func uploadImage(imageData: Data, filename: String) async throws -> String {
        guard let url = URL(string: "\(baseURL)/api/upload") else {
            throw APIError.invalidURL
        }
        
        let boundary = "Boundary-\(UUID().uuidString)"
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let token = getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"\(filename).jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        struct UploadResponse: Decodable {
            let success: Bool
            let url: String
            let error: String?
        }
        
        let result = try JSONDecoder().decode(UploadResponse.self, from: data)
        if result.success {
            return result.url
        } else {
            throw APIError.responseError(result.error ?? "Upload failed")
        }
    }
    
    // Response handler
    private func handleResponse<T: Decodable>(data: Data, response: URLResponse, type: T.Type) throws -> T {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown
        }
        
        if httpResponse.statusCode == 401 {
            if let errorObj = try? JSONDecoder().decode(ErrorResponse.self, from: data), let errMsg = errorObj.error {
                throw APIError.responseError(errMsg)
            }
            throw APIError.unauthorized
        }
        
        if !(200...299).contains(httpResponse.statusCode) {
            if let errorObj = try? JSONDecoder().decode(ErrorResponse.self, from: data), let errMsg = errorObj.error {
                throw APIError.responseError(errMsg)
            }
            throw APIError.responseError("Request failed with status code \(httpResponse.statusCode)")
        }
        
        do {
            return try JSONDecoder().decode(type, from: data)
        } catch {
            print("Decoding error: \(error)")
            throw APIError.serializationError(error.localizedDescription)
        }
    }
}

private struct ErrorResponse: Decodable {
    let success: Bool
    let error: String?
}
