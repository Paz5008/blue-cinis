
import { useBannerTemplateDrawer } from '../banner/useBannerTemplateDrawer';
import { useToast } from '../../../context/ToastContext';
import { Block } from '../../../types/cms';

export interface UseEditorBannerProps {
    isBanner: boolean;
}


export const BANNER_DESIGN_WIDTH = 1200;
export const BANNER_DESIGN_HEIGHT = 400;
export const BANNER_DESIGN_HEIGHT_MOBILE = 320;

export function useEditorBanner({ isBanner }: UseEditorBannerProps) {
    const { addToast } = useToast();

    // Mocking the drawer hook since Structure feature is removed
    const isBannerTemplateDrawerOpen = false;
    const bannerTemplateDraft: any[] = [];
    const bannerTemplateSelection: any[] = [];
    const bannerTemplateHasSelection = false;
    const openBannerTemplateDrawer = () => { };
    const closeBannerTemplateDrawer = () => { };
    const toggleBannerTemplateBlock = () => { };
    const selectAllBannerTemplateBlocks = () => { };
    const clearBannerTemplateSelection = () => { };
    const applyBannerTemplate = () => { };
    const mergeBannerTemplate = () => { };

    /*
    const {
        isOpen: isBannerTemplateDrawerOpen,
        draft: bannerTemplateDraft,
        selectedIndices: bannerTemplateSelection,
        hasSelection: bannerTemplateHasSelection,
        openDrawer: openBannerTemplateDrawer,
        closeDrawer: closeBannerTemplateDrawer,
        toggleIndex: toggleBannerTemplateBlock,
        selectAll: selectAllBannerTemplateBlocks,
        clearSelection: clearBannerTemplateSelection,
        applyAll: applyBannerTemplate,
        mergeSelected: mergeBannerTemplate,
    } = useBannerTemplateDrawer({
        isBanner,
        getPreviewBlocks: () => [], // Disabled
        onApply: () => {}, // Disabled
        onMerge: () => {}, // Disabled
        addToast,
    });
    */

    return {
        isBannerTemplateDrawerOpen,
        bannerTemplateDraft,
        bannerTemplateSelection,
        bannerTemplateHasSelection,
        openBannerTemplateDrawer,
        closeBannerTemplateDrawer,
        toggleBannerTemplateBlock,
        selectAllBannerTemplateBlocks,
        clearBannerTemplateSelection,
        applyBannerTemplate,
        mergeBannerTemplate,
        // Constants
        bannerDesignWidth: BANNER_DESIGN_WIDTH,
        bannerDesignHeight: BANNER_DESIGN_HEIGHT,
        bannerDesignHeightMobile: BANNER_DESIGN_HEIGHT_MOBILE,
    };
}
