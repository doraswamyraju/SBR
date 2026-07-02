import os
import shutil
import subprocess
import zipfile
from glob import glob

# Configurations
desktop_dir = "/Users/doraswamyrajumeesala/Desktop"
cert_name = "Apple Distribution: Doraswamy Raju Meesala (UDYR7AUVZ7)"
temp_dir = os.path.join(desktop_dir, "temp_resign_sbr")

def find_latest_export():
    # Look for folders starting with SBR on the Desktop
    folders = glob(os.path.join(desktop_dir, "SBR*"))
    # Filter only directories
    folders = [f for f in folders if os.path.isdir(f)]
    
    if not folders:
        return None
        
    # Sort by modification time (latest first)
    folders.sort(key=os.path.getmtime, reverse=True)
    latest_folder = folders[0]
    
    # Find .ipa file inside the latest folder
    ipa_files = glob(os.path.join(latest_folder, "*.ipa"))
    if not ipa_files:
        return None
        
    return ipa_files[0]

def main():
    ipa_path = find_latest_export()
    if not ipa_path:
        print("❌ Error: Could not find any exported SBR folder/IPA on your Desktop.")
        print("Please make sure you have:")
        print("1. Opened SBR in Xcode.")
        print("2. Selected 'Any iOS Device (arm64)' as build destination.")
        print("3. Run 'Product > Archive'.")
        print("4. In the Organizer window, clicked 'Distribute App > Custom > App Store Connect > Export'.")
        print("5. Saved the exported folder (named 'SBR <Timestamp>') to your Desktop.")
        return

    output_ipa_path = os.path.join(desktop_dir, "SBR_patched.ipa")
    print(f"📦 Found latest IPA to patch at: {ipa_path}")
    print(f"🔄 Output will be saved to: {output_ipa_path}")

    # 1. Clean and create temp directory
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir)

    print("🔓 Extracting IPA...")
    # 2. Extract IPA
    with zipfile.ZipFile(ipa_path, 'r') as zip_ref:
        zip_ref.extractall(temp_dir)

    # 3. Locate app bundle
    payload_path = os.path.join(temp_dir, "Payload")
    if not os.path.exists(payload_path):
        print("❌ Error: Payload directory not found in IPA structure.")
        return
        
    app_name = os.listdir(payload_path)[0]
    app_path = os.path.join(payload_path, app_name)
    plist_path = os.path.join(app_path, "Info.plist")

    print(f"📱 App bundle found at: {app_path}")

    # 4. Patch Info.plist
    print("🛠️ Patching Info.plist BuildMachineOSBuild to Sonoma 14.5 (23F79)...")
    try:
        subprocess.run(["plutil", "-replace", "BuildMachineOSBuild", "-string", "23F79", plist_path], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to patch Info.plist: {e}")
        return

    # 5. Extract entitlements
    entitlements_path = os.path.join(temp_dir, "entitlements.plist")
    print("🔑 Extracting existing entitlements...")
    try:
        with open(entitlements_path, "wb") as f:
            result = subprocess.run(["codesign", "-d", "--entitlements", ":-", app_path], stdout=subprocess.PIPE, check=True)
            f.write(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to extract entitlements: {e}")
        return

    # 6. Re-sign nested Frameworks and App Extensions first (bottom-up signing)
    frameworks_path = os.path.join(app_path, "Frameworks")
    if os.path.exists(frameworks_path):
        for fw in os.listdir(frameworks_path):
            fw_path = os.path.join(frameworks_path, fw)
            if fw.endswith(".framework") or fw.endswith(".dylib"):
                print(f"✍️ Re-signing framework: {fw}")
                subprocess.run(["codesign", "-f", "-s", cert_name, "--timestamp", fw_path], check=True)

    plugins_path = os.path.join(app_path, "PlugIns")
    if os.path.exists(plugins_path):
        for pl in os.listdir(plugins_path):
            pl_path = os.path.join(plugins_path, pl)
            if pl.endswith(".appex"):
                print(f"✍️ Re-signing app extension: {pl}")
                # Try to extract entitlements for the appex if any
                pl_ent_path = os.path.join(temp_dir, f"{pl}_entitlements.plist")
                with open(pl_ent_path, "wb") as f:
                    res = subprocess.run(["codesign", "-d", "--entitlements", ":-", pl_path], stdout=subprocess.PIPE)
                    if res.returncode == 0:
                        f.write(res.stdout)
                        subprocess.run(["codesign", "-f", "-s", cert_name, "--entitlements", pl_ent_path, "--timestamp", pl_path], check=True)
                    else:
                        subprocess.run(["codesign", "-f", "-s", cert_name, "--timestamp", pl_path], check=True)

    # 7. Re-sign main app bundle
    print("✍️ Re-signing main app bundle...")
    try:
        subprocess.run(["codesign", "-f", "-s", cert_name, "--entitlements", entitlements_path, "--timestamp", app_path], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to sign main app bundle: {e}")
        return

    # 8. Repackage into IPA
    print("🔒 Zipping back to IPA...")
    try:
        shutil.make_archive(os.path.join(temp_dir, "patched"), 'zip', temp_dir, "Payload")
        shutil.move(os.path.join(temp_dir, "patched.zip"), output_ipa_path)
    except Exception as e:
        print(f"❌ Failed to package IPA: {e}")
        return

    # 9. Clean up
    shutil.rmtree(temp_dir)
    print(f"✅ Success! Created patched and signed IPA at: {output_ipa_path}")
    print("🚀 You can now drag and drop this file into Transporter to upload it to App Store Connect.")

if __name__ == "__main__":
    main()
