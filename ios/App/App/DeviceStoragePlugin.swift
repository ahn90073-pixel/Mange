import Foundation
import Capacitor

@objc(DeviceStoragePlugin)
public class DeviceStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DeviceStoragePlugin"
    public let jsName = "DeviceStorage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise)
    ]

    private let defaults = UserDefaults(suiteName: "mange.device.storage")!

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty,
              let value = call.getString("value") else {
            call.reject("key and value are required")
            return
        }
        defaults.set(value, forKey: key)
        call.resolve()
    }

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("key is required")
            return
        }
        var result: [String: Any] = [:]
        if let value = defaults.string(forKey: key) {
            result["value"] = value
        }
        call.resolve(result)
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("key is required")
            return
        }
        defaults.removeObject(forKey: key)
        call.resolve()
    }
}
