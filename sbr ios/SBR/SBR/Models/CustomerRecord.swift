import Foundation

struct CustomerRecord: Identifiable, Codable, Hashable {
    let id: String
    let sNo: String?
    let name: String
    let address: String?
    let product: String?
    let model: String?
    let purchaseDate: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case sNo
        case name
        case address
        case product
        case model
        case purchaseDate
    }
}

struct CustomerListResponse: Codable {
    let success: Bool
    let count: Int?
    let products: [String]?
    let data: [CustomerRecord]?
    let message: String?
    let error: String?
}

struct GenericAPIResponse: Codable {
    let success: Bool
    let message: String?
    let error: String?
}
