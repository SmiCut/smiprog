import UIKit
import WebKit

/// Render the same versioned HTML report as SmiProg Online. iOS 16+.
@MainActor
public final class SmiProgPrintKit: NSObject, WKNavigationDelegate {
    public enum Report: String { case main, cnc, compare }
    public struct Field {
        public let id: String
        public let value: String
        public init(_ id: String, _ value: String) { self.id = id; self.value = value }
    }

    private var navigation: CheckedContinuation<Void, Error>?
    private var rendering = false
    private let resources: URL
    public init(resources: URL) { self.resources = resources }

    public static func language(for identifier: String) -> String {
        let code = identifier.lowercased().replacingOccurrences(of: "_", with: "-")
        let parts = code.split(separator: "-").map(String.init)
        if parts.first == "zh" {
            return parts.contains(where: { ["hant","tw","hk","mo"].contains($0) }) ? "zh-tw" : "zh"
        }
        let supported = ["en","sv","da","de","es","fr","hu","id","it","ja","ko","nl","pl","ru"]
        return parts.first.flatMap { supported.contains($0) ? $0 : nil } ?? "en"
    }

    /// Pass fields in dependency order. Use the app's current CNC text for a parity check.
    public func pdf(language: String, report: Report, fields: [Field],
                    expectedCnc: String? = nil, cataloguePrices: Bool = false,
                    discount: String? = nil, in host: UIView) async throws -> Data {
        guard !rendering else { throw issue("An export is already running.") }
        rendering = true
        defer { rendering = false }
        let html = resources.appendingPathComponent("smiprog-\(Self.language(for: language)).html")
        let bridge = try String(contentsOf: resources.appendingPathComponent("report-page.js"), encoding: .utf8)
        guard FileManager.default.fileExists(atPath: html.path) else { throw issue(html.lastPathComponent) }
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent()
        let web = WKWebView(frame: CGRect(x: 0, y: 0, width: 794, height: 1123), configuration: config)
        let container = UIView(frame: CGRect(x: 0, y: 0, width: 1, height: 1))
        container.accessibilityElementsHidden = true
        container.isUserInteractionEnabled = false
        container.clipsToBounds = true
        host.insertSubview(container, at: 0)
        container.addSubview(web)
        web.navigationDelegate = self
        defer { web.navigationDelegate = nil; web.stopLoading(); container.removeFromSuperview() }
        try await withCheckedThrowingContinuation { continuation in
            navigation = continuation
            if web.loadFileURL(html, allowingReadAccessTo: resources) == nil {
                finish(.failure(issue("Unable to load the report.")))
            }
        }
        let values = fields.map { ["id": $0.id, "value": $0.value] }
        let result = try await web.callAsyncJavaScript(
            bridge + "\nreturn await prepareSmiProgPages(mode, fields, expectedCnc, cataloguePrices, discount);",
            arguments: ["mode": report.rawValue, "fields": values, "cataloguePrices": cataloguePrices,
                        "discount": (discount as Any?) ?? NSNull(), "expectedCnc": (expectedCnc as Any?) ?? NSNull()],
            in: nil, contentWorld: .page)
        guard let bounds = result as? [[String: CGFloat]], !bounds.isEmpty else { throw issue("No report pages.") }
        var pages: [CGPDFDocument] = []
        for box in bounds {
            guard let x = box["x"], let y = box["y"], let w = box["width"], let h = box["height"],
                  w > 0, h > 0 else { throw issue("Invalid page bounds.") }
            let options = WKPDFConfiguration()
            options.rect = CGRect(x: x, y: y, width: w, height: h)
            let bytes = try await web.pdf(configuration: options)
            guard let provider = CGDataProvider(data: bytes as CFData),
                  let doc = CGPDFDocument(provider), doc.numberOfPages == 1 else { throw issue("Invalid PDF page.") }
            pages.append(doc)
        }
        let a4 = CGRect(x: 0, y: 0, width: 210 * 72.0 / 25.4, height: 297 * 72.0 / 25.4)
        return UIGraphicsPDFRenderer(bounds: a4).pdfData { output in
            for doc in pages {
                guard let page = doc.page(at: 1) else { continue }
                output.beginPage()
                let ctx = output.cgContext
                ctx.saveGState()
                ctx.translateBy(x: 0, y: a4.height)
                ctx.scaleBy(x: 1, y: -1)
                ctx.concatenate(page.getDrawingTransform(.mediaBox, rect: a4, rotate: 0, preserveAspectRatio: true))
                ctx.drawPDFPage(page)
                ctx.restoreGState()
            }
        }
    }

    private func issue(_ message: String) -> NSError {
        NSError(domain: "SmiProgPrintKit", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
    }
    private func finish(_ result: Result<Void, Error>) {
        let pending = navigation
        navigation = nil
        pending?.resume(with: result)
    }
    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { finish(.success(())) }
    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { finish(.failure(error)) }
    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { finish(.failure(error)) }
    public func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { finish(.failure(issue("WebKit stopped."))) }
}
