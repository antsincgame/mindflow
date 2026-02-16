// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "MindFlow",
    platforms: [
        .iOS(.v16),
        .watchOS(.v9)
    ],
    products: [
        .library(
            name: "MindFlow",
            targets: ["MindFlow"]
        )
    ],
    dependencies: [
        .package(
            url: "https://github.com/supabase/supabase-swift.git",
            exact: "2.5.1"
        ),
        .package(
            url: "https://github.com/apple/swift-log.git",
            from: "1.5.0"
        )
    ],
    targets: [
        .target(
            name: "MindFlow",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift"),
                .product(name: "Logging", package: "swift-log")
            ],
            path: "src",
            resources: [
                .process("Resources")
            ]
        ),
        .testTarget(
            name: "MindFlowTests",
            dependencies: ["MindFlow"],
            path: "Tests/MindFlowTests"
        )
    ]
)