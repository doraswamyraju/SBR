import Foundation

struct Referral: Codable, Identifiable, Hashable {
    let id: String
    let referrerId: String? // Usually ObjectId string
    let referralCode: String
    let refereeName: String
    let refereePhone: String
    let productId: String?
    let productName: String
    let rewardAmount: Double
    let notes: String?
    let status: String
    let purchaseAmount: Double?
    let createdAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case referrerId, referralCode, refereeName, refereePhone, productId, productName
        case rewardAmount, notes, status, purchaseAmount, createdAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Handle id with fallback
        if let decodedId = try? container.decode(String.self, forKey: .id) {
            self.id = decodedId
        } else {
            struct AnyCodingKey: CodingKey {
                var stringValue: String
                init?(stringValue: String) { self.stringValue = stringValue }
                var intValue: Int?
                init?(intValue: Int) { return nil }
            }
            let rootContainer = try decoder.container(keyedBy: AnyCodingKey.self)
            if let idVal = try? rootContainer.decode(String.self, forKey: AnyCodingKey(stringValue: "id")!) {
                self.id = idVal
            } else {
                self.id = ""
            }
        }
        
        // Handle referrerId which might be string or dictionary
        if let refIdStr = try? container.decodeIfPresent(String.self, forKey: .referrerId) {
            self.referrerId = refIdStr
        } else if let refIdDict = try? container.decodeIfPresent([String: String].self, forKey: .referrerId) {
            self.referrerId = refIdDict["_id"] ?? refIdDict["id"]
        } else {
            self.referrerId = nil
        }
        
        self.referralCode = try container.decodeIfPresent(String.self, forKey: .referralCode) ?? ""
        self.refereeName = try container.decodeIfPresent(String.self, forKey: .refereeName) ?? ""
        self.refereePhone = try container.decodeIfPresent(String.self, forKey: .refereePhone) ?? ""
        self.productId = try container.decodeIfPresent(String.self, forKey: .productId)
        self.productName = try container.decodeIfPresent(String.self, forKey: .productName) ?? ""
        self.rewardAmount = try container.decodeIfPresent(Double.self, forKey: .rewardAmount) ?? 0.0
        self.notes = try container.decodeIfPresent(String.self, forKey: .notes)
        self.status = try container.decodeIfPresent(String.self, forKey: .status) ?? "Pending"
        self.purchaseAmount = try container.decodeIfPresent(Double.self, forKey: .purchaseAmount)
        self.createdAt = try container.decodeIfPresent(String.self, forKey: .createdAt)
    }
}

struct ReferralClaim: Codable, Identifiable, Hashable {
    let id: String
    let userId: String?
    let userName: String
    let userPhone: String
    let amount: Double
    let payoutMethod: String
    let payoutDetails: String
    let status: String
    let transactionRef: String?
    let adminNotes: String?
    let createdAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case userId, userName, userPhone, amount, payoutMethod, payoutDetails, status, transactionRef, adminNotes, createdAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Handle id with fallback
        if let decodedId = try? container.decode(String.self, forKey: .id) {
            self.id = decodedId
        } else {
            struct AnyCodingKey: CodingKey {
                var stringValue: String
                init?(stringValue: String) { self.stringValue = stringValue }
                var intValue: Int?
                init?(intValue: Int) { return nil }
            }
            let rootContainer = try decoder.container(keyedBy: AnyCodingKey.self)
            if let idVal = try? rootContainer.decode(String.self, forKey: AnyCodingKey(stringValue: "id")!) {
                self.id = idVal
            } else {
                self.id = ""
            }
        }
        
        // Handle userId which might be string or dictionary
        if let uIdStr = try? container.decodeIfPresent(String.self, forKey: .userId) {
            self.userId = uIdStr
        } else if let uIdDict = try? container.decodeIfPresent([String: String].self, forKey: .userId) {
            self.userId = uIdDict["_id"] ?? uIdDict["id"]
        } else {
            self.userId = nil
        }
        
        self.userName = try container.decodeIfPresent(String.self, forKey: .userName) ?? ""
        self.userPhone = try container.decodeIfPresent(String.self, forKey: .userPhone) ?? ""
        self.amount = try container.decodeIfPresent(Double.self, forKey: .amount) ?? 0.0
        self.payoutMethod = try container.decodeIfPresent(String.self, forKey: .payoutMethod) ?? ""
        self.payoutDetails = try container.decodeIfPresent(String.self, forKey: .payoutDetails) ?? ""
        self.status = try container.decodeIfPresent(String.self, forKey: .status) ?? "Pending"
        self.transactionRef = try container.decodeIfPresent(String.self, forKey: .transactionRef)
        self.adminNotes = try container.decodeIfPresent(String.self, forKey: .adminNotes)
        self.createdAt = try container.decodeIfPresent(String.self, forKey: .createdAt)
    }
}

struct ReferralDashboard: Codable {
    let referralCode: String
    let totalInvited: Int
    let convertedCount: Int
    let totalEarnings: Double
    let claimedEarnings: Double
    let availableBalance: Double
    let pendingEarnings: Double
    let referrals: [Referral]
    let claims: [ReferralClaim]
}

struct SubmitReferralRequest: Codable {
    let refereeName: String
    let refereePhone: String
    let productId: String?
    let productName: String
    let notes: String?
}

struct ClaimPayoutRequest: Codable {
    let amount: Double
    let payoutMethod: String
    let payoutDetails: String
}

struct UpdateReferralStatusRequest: Codable {
    let status: String
    let purchaseAmount: Double?
    let rewardAmount: Double?
    let notes: String?
}

struct UpdateClaimStatusRequest: Codable {
    let status: String
    let transactionRef: String?
    let adminNotes: String?
}
