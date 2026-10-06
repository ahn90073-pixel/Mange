import Capacitor

class MangeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(DeviceStoragePlugin())
    }
}
