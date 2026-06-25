import Foundation

struct LocationPoint: Codable {
    let latitude: Double
    let longitude: Double
    let timestamp: String?
}

enum RequestStatus: String, Codable {
    case pending = "Pending"
    case assigned = "Assigned"
    case accepted = "Accepted"
    case inProgress = "In Progress"
    case completed = "Completed"
    case cancelled = "Cancelled"
}

struct ServiceRequest: Codable, Identifiable {
    let id: String
    let customerId: User?
    let assignedAgentId: User?
    let serviceType: String
    let description: String?
    let customerAddress: String
    let status: RequestStatus
    let createdBy: String
    let acceptedAt: String?
    let completedAt: String?
    let beforeImageUrl: String?
    let afterImageUrl: String?
    let paymentAmount: Double?
    let paymentStatus: String?
    let paymentMethod: String?
    let paymentTimestamp: String?
    let locationPath: [LocationPoint]?
    let requestReview: Bool?
    let createdAt: String
    let updatedAt: String

    var resolvedBeforeImageUrl: URL? {
        resolveUrl(beforeImageUrl)
    }
    
    var resolvedAfterImageUrl: URL? {
        resolveUrl(afterImageUrl)
    }
    
    private func resolveUrl(_ urlStr: String?) -> URL? {
        guard let urlStr = urlStr, !urlStr.isEmpty else { return nil }
        var correctedStr = urlStr
        if correctedStr.contains("localhost") || correctedStr.contains("127.0.0.1") {
            if let regex = try? NSRegularExpression(pattern: "https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?", options: .caseInsensitive) {
                let range = NSRange(location: 0, length: correctedStr.utf16.count)
                correctedStr = regex.stringByReplacingMatches(in: correctedStr, options: [], range: range, withTemplate: "https://sbr.sriddha.com")
            }
        }
        if !correctedStr.lowercased().hasPrefix("http://") && !correctedStr.lowercased().hasPrefix("https://") {
            let base = "https://sbr.sriddha.com"
            if correctedStr.hasPrefix("/") {
                correctedStr = base + correctedStr
            } else {
                correctedStr = base + "/" + correctedStr
            }
        }
        return URL(string: correctedStr)
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case _id
        case customerId, assignedAgentId, serviceType, description, customerAddress, status, createdBy, acceptedAt, completedAt, beforeImageUrl, afterImageUrl, paymentAmount, paymentStatus, paymentMethod, paymentTimestamp, locationPath, requestReview, createdAt, updatedAt
    }
    
    private static func decodeDate(from container: KeyedDecodingContainer<CodingKeys>, key: CodingKeys) -> String? {
        if let stringVal = try? container.decodeIfPresent(String.self, forKey: key) {
            return stringVal
        }
        if let doubleVal = try? container.decodeIfPresent(Double.self, forKey: key) {
            let date: Date
            if doubleVal > 100000000000 { // Milliseconds
                date = Date(timeIntervalSince1970: doubleVal / 1000.0)
            } else { // Seconds
                date = Date(timeIntervalSince1970: doubleVal)
            }
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            return formatter.string(from: date)
        }
        return nil
    }

    private static func decodeDouble(from container: KeyedDecodingContainer<CodingKeys>, key: CodingKeys) -> Double? {
        if let doubleVal = try? container.decodeIfPresent(Double.self, forKey: key) {
            return doubleVal
        }
        if let intVal = try? container.decodeIfPresent(Int.self, forKey: key) {
            return Double(intVal)
        }
        if let stringVal = try? container.decodeIfPresent(String.self, forKey: key), let parsedDouble = Double(stringVal) {
            return parsedDouble
        }
        return nil
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Handle id decoding fallback to ensure parsing compatibility with all endpoints
        if let decodedId = try container.decodeIfPresent(String.self, forKey: .id) {
            self.id = decodedId
        } else if let decodedUnderscoreId = try container.decodeIfPresent(String.self, forKey: ._id) {
            self.id = decodedUnderscoreId
        } else {
            throw DecodingError.keyNotFound(CodingKeys.id, DecodingError.Context(codingPath: container.codingPath, debugDescription: "Key id or _id not found in payload"))
        }
        
        // Safe decoding for customerId
        if let customerObj = try? container.decodeIfPresent(User.self, forKey: .customerId) {
            self.customerId = customerObj
        } else if let customerIdStr = try? container.decodeIfPresent(String.self, forKey: .customerId) {
            self.customerId = User(id: customerIdStr, name: "Customer", email: "")
        } else {
            self.customerId = nil
        }
        
        // Safe decoding for assignedAgentId
        if let agentObj = try? container.decodeIfPresent(User.self, forKey: .assignedAgentId) {
            self.assignedAgentId = agentObj
        } else if let agentIdStr = try? container.decodeIfPresent(String.self, forKey: .assignedAgentId) {
            self.assignedAgentId = User(id: agentIdStr, name: "Agent", email: "")
        } else {
            self.assignedAgentId = nil
        }
        
        self.serviceType = try container.decodeIfPresent(String.self, forKey: .serviceType) ?? ""
        self.description = try container.decodeIfPresent(String.self, forKey: .description)
        self.customerAddress = try container.decodeIfPresent(String.self, forKey: .customerAddress) ?? ""
        self.status = try container.decodeIfPresent(RequestStatus.self, forKey: .status) ?? .pending
        self.createdBy = try container.decodeIfPresent(String.self, forKey: .createdBy) ?? "CUSTOMER"
        
        self.acceptedAt = Self.decodeDate(from: container, key: .acceptedAt)
        self.completedAt = Self.decodeDate(from: container, key: .completedAt)
        self.beforeImageUrl = try container.decodeIfPresent(String.self, forKey: .beforeImageUrl)
        self.afterImageUrl = try container.decodeIfPresent(String.self, forKey: .afterImageUrl)
        self.paymentAmount = Self.decodeDouble(from: container, key: .paymentAmount)
        self.paymentStatus = try container.decodeIfPresent(String.self, forKey: .paymentStatus)
        self.paymentMethod = try container.decodeIfPresent(String.self, forKey: .paymentMethod)
        self.paymentTimestamp = Self.decodeDate(from: container, key: .paymentTimestamp)
        self.locationPath = try container.decodeIfPresent([LocationPoint].self, forKey: .locationPath)
        self.requestReview = try container.decodeIfPresent(Bool.self, forKey: .requestReview)
        
        self.createdAt = Self.decodeDate(from: container, key: .createdAt) ?? ""
        self.updatedAt = Self.decodeDate(from: container, key: .updatedAt) ?? ""
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encodeIfPresent(customerId, forKey: .customerId)
        try container.encodeIfPresent(assignedAgentId, forKey: .assignedAgentId)
        try container.encode(serviceType, forKey: .serviceType)
        try container.encodeIfPresent(description, forKey: .description)
        try container.encode(customerAddress, forKey: .customerAddress)
        try container.encode(status, forKey: .status)
        try container.encode(createdBy, forKey: .createdBy)
        try container.encodeIfPresent(acceptedAt, forKey: .acceptedAt)
        try container.encodeIfPresent(completedAt, forKey: .completedAt)
        try container.encodeIfPresent(beforeImageUrl, forKey: .beforeImageUrl)
        try container.encodeIfPresent(afterImageUrl, forKey: .afterImageUrl)
        try container.encodeIfPresent(paymentAmount, forKey: .paymentAmount)
        try container.encodeIfPresent(paymentStatus, forKey: .paymentStatus)
        try container.encodeIfPresent(paymentMethod, forKey: .paymentMethod)
        try container.encodeIfPresent(paymentTimestamp, forKey: .paymentTimestamp)
        try container.encodeIfPresent(locationPath, forKey: .locationPath)
        try container.encodeIfPresent(requestReview, forKey: .requestReview)
        try container.encode(createdAt, forKey: .createdAt)
        try container.encode(updatedAt, forKey: .updatedAt)
    }
}
