import Foundation

struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let error: String?
}

struct Product: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let slug: String?
    let category: String?
    let image: String?
    let images: [String]?
    let subtitle: String?
    let tagline: String?
    let description: String?
    let features: [String]?
    let basePrice: Double?
    let mrp: Double?
    let commissionType: String?
    let commissionValue: Double?
    let isActive: Bool?
    let createdAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, slug, category, image, images, subtitle, tagline, description, features
        case basePrice, mrp, commissionType, commissionValue, isActive, createdAt
    }
    
    // Custom decoding to support fallback or single key id
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Handle id with fallback
        if let decodedId = try? container.decode(String.self, forKey: .id) {
            self.id = decodedId
        } else {
            // Check if there is an id key without underscore
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
        
        self.name = try container.decodeIfPresent(String.self, forKey: .name) ?? ""
        self.slug = try container.decodeIfPresent(String.self, forKey: .slug)
        self.category = try container.decodeIfPresent(String.self, forKey: .category)
        self.image = try container.decodeIfPresent(String.self, forKey: .image)
        self.images = try container.decodeIfPresent([String].self, forKey: .images)
        self.subtitle = try container.decodeIfPresent(String.self, forKey: .subtitle)
        self.tagline = try container.decodeIfPresent(String.self, forKey: .tagline)
        self.description = try container.decodeIfPresent(String.self, forKey: .description)
        self.features = try container.decodeIfPresent([String].self, forKey: .features)
        self.basePrice = try container.decodeIfPresent(Double.self, forKey: .basePrice)
        self.mrp = try container.decodeIfPresent(Double.self, forKey: .mrp)
        self.commissionType = try container.decodeIfPresent(String.self, forKey: .commissionType)
        self.commissionValue = try container.decodeIfPresent(Double.self, forKey: .commissionValue)
        self.isActive = try container.decodeIfPresent(Bool.self, forKey: .isActive)
        self.createdAt = try container.decodeIfPresent(String.self, forKey: .createdAt)
    }
}

struct ProductRequest: Codable {
    let name: String
    let slug: String?
    let category: String
    let image: String?
    let images: [String]?
    let subtitle: String?
    let tagline: String?
    let description: String?
    let features: [String]?
    let basePrice: Double?
    let mrp: Double?
    let commissionType: String?
    let commissionValue: Double?
    let isActive: Bool
}
