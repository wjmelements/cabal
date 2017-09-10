#import "ProposalVC.h"

#import "Color.h"

@implementation ProposalVC

+ (ProposalVC *)shared {
    static ProposalVC *shared = nil;
    if (shared == nil) {
        shared = [ProposalVC new];
    }
    return shared;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    self.view.backgroundColor = [Color enact];
    CGRect bounds = self.view.bounds;
    #define NUM_BUTTONS 5
    CGFloat buttonHeight = bounds.size.height / (NUM_BUTTONS + 2);
    UIColor *colors[NUM_BUTTONS] = {
        [Color enact],
        [Color revise],
        [Color lol],
        [Color reject],
        [Color skip]
    };
    UIColor *titleColors[NUM_BUTTONS] = {
        [Color whiteColor],
        [Color whiteColor],
        [Color blackColor],
        [Color blackColor],
        [Color blackColor]
    };
    NSString *labels[NUM_BUTTONS] = {
        @"ENACT",
        @"REVISE",
        @"LOL",
        @"REJECT",
        @"SKIP"
    };
    UIButton *buttons[NUM_BUTTONS];
    for (uint16_t i = 6; i --> 1; ) {
        UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
        button.frame = CGRectMake(
            0,
            bounds.size.height - i * buttonHeight,
            bounds.size.width,
            buttonHeight
        );
        button.backgroundColor = colors[NUM_BUTTONS - i];
        [button
            setTitle:labels[NUM_BUTTONS - i]
            forState:UIControlStateNormal
        ];
        [button
            setTitleColor:titleColors[NUM_BUTTONS - i]
            forState:UIControlStateNormal
        ];
        [self.view addSubview:button];
    }
    #undef NUM_BUTTONS
}

@end
