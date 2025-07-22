require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-aaiios-liveness-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  react-native-aaiios-liveness-sdk
                   DESC
  s.homepage     = "https://github.com/github_account/react-native-aaiios-liveness-sdk"
  # brief license entry:
  s.license      = "MIT"
  # optional - use expanded license entry instead:
  # s.license    = { :type => "MIT", :file => "LICENSE" }
  s.authors      = { "Your Name" => "yourname@email.com" }
  s.platforms    = { :ios => "9.0" }
  s.source       = { :git => "https://github.com/github_account/react-native-aaiios-liveness-sdk.git", :tag => "#{s.version}" }

  s.source_files = "ios/RNLivenessPlugin/*.{h,m}"
  s.requires_arc = true

  s.dependency "React"
  # ...
  s.dependency 'AAILivenessUI'
  s.static_framework = true
end

