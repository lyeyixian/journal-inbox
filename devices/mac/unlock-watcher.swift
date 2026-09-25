// Posts mac_unlocked to event intake each time the screen unlocks.
// launchd keeps it running; install.sh compiles it and writes the agent.

import Foundation

let env = ProcessInfo.processInfo.environment
guard
  let base = env["JOURNAL_INBOX_URL"],
  let url = URL(string: base + "/events"),
  let secret = env["EVENT_INTAKE_SECRET"]
else {
  FileHandle.standardError.write(
    Data("JOURNAL_INBOX_URL and EVENT_INTAKE_SECRET must be set\n".utf8))
  exit(1)
}

func log(_ message: String) {
  print("\(Date().ISO8601Format()) \(message)")
  fflush(stdout)
}

// Tailscale can take a moment to reconnect after the lid opens, so a network
// error is retried a few times. An HTTP error will not heal and is not retried.
func post(attempt: Int) {
  var request = URLRequest(url: url, timeoutInterval: 5)
  request.httpMethod = "POST"
  request.setValue("application/json", forHTTPHeaderField: "content-type")
  request.setValue(secret, forHTTPHeaderField: "x-event-secret")
  request.httpBody = Data(#"{"name":"mac_unlocked"}"#.utf8)

  URLSession.shared.dataTask(with: request) { _, response, error in
    if let error {
      log("mac_unlocked attempt \(attempt) failed: \(error.localizedDescription)")
      if attempt < 5 {
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
          post(attempt: attempt + 1)
        }
      }
      return
    }
    let status = (response as? HTTPURLResponse)?.statusCode ?? 0
    log("mac_unlocked answered \(status)")
  }.resume()
}

DistributedNotificationCenter.default().addObserver(
  forName: Notification.Name("com.apple.screenIsUnlocked"),
  object: nil,
  queue: .main
) { _ in post(attempt: 1) }

log("watching for unlocks, posting to \(url)")
RunLoop.main.run()
