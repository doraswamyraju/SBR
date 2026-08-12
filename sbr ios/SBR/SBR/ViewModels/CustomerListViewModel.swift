import Foundation
import SwiftUI
import Combine

@MainActor
class CustomerListViewModel: ObservableObject {
    @Published var customers: [CustomerRecord] = []
    @Published var availableProducts: [String] = []
    @Published var searchQuery: String = ""
    @Published var selectedProduct: String = "All"
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil
    
    func fetchCustomers() async {
        isLoading = true
        errorMessage = nil
        
        var queryParams: [String] = []
        let trimmedSearch = searchQuery.trimmingCharacters(in: .whitespaces)
        if !trimmedSearch.isEmpty {
            if let encodedSearch = trimmedSearch.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) {
                queryParams.append("search=\(encodedSearch)")
            }
        }
        if selectedProduct != "All" {
            if let encodedProduct = selectedProduct.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) {
                queryParams.append("product=\(encodedProduct)")
            }
        }
        
        let queryString = queryParams.isEmpty ? "" : "?\(queryParams.joined(separator: "&"))"
        let endpoint = "api/customer-list\(queryString)"
        
        do {
            let res = try await APIClient.shared.get(endpoint: endpoint, responseType: CustomerListResponse.self)
            if res.success {
                self.customers = res.data ?? []
                if let prods = res.products {
                    self.availableProducts = prods
                }
            } else {
                self.errorMessage = res.error ?? "Failed to fetch customer list"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func deleteRecord(id: String) async {
        do {
            let res = try await APIClient.shared.delete(endpoint: "api/customer-list/\(id)", responseType: GenericAPIResponse.self)
            if res.success {
                await fetchCustomers()
            } else {
                self.errorMessage = res.error ?? "Failed to delete customer record"
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
    }
}
