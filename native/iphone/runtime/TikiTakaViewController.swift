
// Compiled alongside AppDelegate, which already imports UIKit and Capacitor.
class TikiTakaViewController: CAPBridgeViewController {
    private var resumeObserver: NSObjectProtocol?

    override func viewDidLoad() {
        super.viewDidLoad()
        overrideUserInterfaceStyle = .light
        guard let content = webView else { return }
        let container = UIView(frame: view.bounds)
        container.backgroundColor = UIColor(red: 246/255, green: 244/255, blue: 238/255, alpha: 1)
        view = container
        content.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(content)
        NSLayoutConstraint.activate([
            content.topAnchor.constraint(equalTo: container.safeAreaLayoutGuide.topAnchor),
            content.bottomAnchor.constraint(equalTo: container.safeAreaLayoutGuide.bottomAnchor),
            content.leadingAnchor.constraint(equalTo: container.safeAreaLayoutGuide.leadingAnchor),
            content.trailingAnchor.constraint(equalTo: container.safeAreaLayoutGuide.trailingAnchor)
        ])
        resumeObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main
        ) { [weak self] _ in
            self?.webView?.evaluateJavaScript("document.dispatchEvent(new Event('visibilitychange'))", completionHandler: nil)
        }
    }

    deinit {
        if let observer = resumeObserver { NotificationCenter.default.removeObserver(observer) }
    }
}
