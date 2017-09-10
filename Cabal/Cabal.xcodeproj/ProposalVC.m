#import "ProposalVC.h"

@interface ProposalVC ()

@end

@implementation ProposalVC

+ (ProposalVC *)shared {
    static ProposalVC *shared = null;
    if (shared == null) {
        shared = [ProposalVC new];
    }
    return shared;
}

- (void)viewDidLoad {
    [super viewDidLoad];
}

@end
