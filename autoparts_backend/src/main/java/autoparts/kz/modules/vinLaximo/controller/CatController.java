package autoparts.kz.modules.vinLaximo.controller;


import autoparts.kz.modules.vinLaximo.dto.*;
import autoparts.kz.modules.vinLaximo.service.CatService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Map;

@Validated
@RestController
@RequestMapping("/api/v1/cat")
public class CatController {

    private final CatService cat;
    
    public CatController(CatService cat) { 
        this.cat = cat; 
    }




    // --- Catalogs ---
    @GetMapping("/catalogs")
    public List<CatalogDto> catalogs(){ return cat.listCatalogs(); }

    @GetMapping("/catalogs/{catalog}")
    public CatalogInfoDto catalogInfo(@PathVariable String catalog){
        return cat.getCatalogInfo(catalog);
    }

    // --- Vehicle search (VIN / FRAME / PLATE) ---
    @GetMapping("/vehicle/by-vin/{vin}")
    public VehicleDto byVin(@PathVariable String vin,
                            @RequestParam(required=false) String catalog){
        return cat.findByVin(vin, catalog);
    }

    @GetMapping("/vehicle/by-frame")
    public VehicleDto byFrame(@RequestParam String frame,
                              @RequestParam String frameNo,
                              @RequestParam(required=false) String catalog){
        return cat.findByFrame(frame, frameNo, catalog);
    }

    @GetMapping("/vehicle/by-plate/{plate}")
    public VehicleDto byPlate(@PathVariable String plate){
        return cat.findByPlateNumber(plate);
    }

    // --- Wizard (GetWizard2 / Next / Finish) ---
    @GetMapping("/{catalog}/wizard/start")
    public WizardStepDto wizardStart(@PathVariable String catalog){
        return cat.wizardStart(catalog);
    }

    @PostMapping("/{catalog}/wizard/next")
    public WizardStepDto wizardNext(@PathVariable String catalog,
                                    @RequestParam String ssd,
                                    @RequestBody Map<String,String> selections){
        return cat.wizardNext(catalog, ssd, selections);
    }

    @PostMapping("/{catalog}/wizard/finish")
    public VehicleDto wizardFinish(@PathVariable String catalog,
                                   @RequestParam String ssd,
                                   @RequestBody Map<String,String> selections){
        return cat.wizardFinish(catalog, ssd, selections);
    }

    // --- Categories / Units / UnitInfo / Details / ImageMap / Filters ---
    @GetMapping("/{catalog}/categories")
    public List<CategoryDto> categories(@PathVariable String catalog,
                                        @RequestParam String vehicleId,
                                        @RequestParam String ssd){
        return cat.listCategories(catalog, vehicleId, ssd);
    }

    @GetMapping("/{catalog}/units")
    public List<UnitDto> units(@PathVariable String catalog,
                               @RequestParam String vehicleId,
                               @RequestParam String ssd,
                               @RequestParam long categoryId){
        return cat.listUnits(catalog, vehicleId, ssd, categoryId);
    }

    @GetMapping("/{catalog}/units/{unitId}")
    public UnitInfoDto unitInfo(@PathVariable String catalog,
                                @PathVariable long unitId,
                                @RequestParam String ssd){
        return cat.getUnitInfo(catalog, unitId, ssd);
    }

    @GetMapping("/{catalog}/units/{unitId}/details")
    public List<DetailDto> unitDetails(@PathVariable String catalog,
                                       @PathVariable long unitId,
                                       @RequestParam String ssd){
        return cat.listDetailsByUnit(catalog, ssd, (int) unitId);
    }

    @GetMapping("/{catalog}/units/{unitId}/imagemap")
    public List<ImageMapDto> unitImageMap(@PathVariable String catalog,
                                          @PathVariable long unitId,
                                          @RequestParam String ssd){
        return cat.listImageMapByUnit(catalog, unitId, ssd);
    }

    // Временный endpoint для получения сырого XML от ListImageMapByUnit
    @GetMapping("/{catalog}/units/{unitId}/imagemap/raw")
    public String unitImageMapRaw(@PathVariable String catalog,
                                  @PathVariable long unitId,
                                  @RequestParam String ssd){
        return cat.listImageMapByUnitRaw(catalog, unitId, ssd);
    }

    @GetMapping("/{catalog}/filters/unit")
    public List<FilterOptionDto> filterByUnit(@PathVariable String catalog,
                                              @RequestParam long unitId,
                                              @RequestParam String vehicleId,
                                              @RequestParam String ssd,
                                              @RequestParam String filter){
        return cat.getFilterByUnit(catalog, unitId, vehicleId, ssd, filter);
    }

    @GetMapping("/{catalog}/filters/detail")
    public List<FilterOptionDto> filterByDetail(@PathVariable String catalog,
                                                @RequestParam long detailId,
                                                @RequestParam String vehicleId,
                                                @RequestParam String ssd){
        return cat.getFilterByDetail(catalog, detailId, vehicleId, ssd);
    }
    @GetMapping("/{catalog}/vehicle/info")
    public VehicleDto vehicleInfo(@PathVariable String catalog,
                                  @RequestParam String vehicleId,
                                  @RequestParam String ssd) {
        return cat.getVehicleInfo(catalog, vehicleId, ssd);
    }


    @GetMapping("/{catalog}/quick/groups")
    public List<QuickGroupDto> quickGroups(@PathVariable String catalog,
                                           @RequestParam String vehicleId,
                                           @RequestParam String ssd) {
        return cat.listQuickGroups(catalog, vehicleId, ssd);
    }

    @GetMapping("/{catalog}/quick/details")
    public List<DetailDto> quickDetails(@PathVariable String catalog,
                                        @RequestParam String vehicleId,
                                        @RequestParam String ssd,
                                        @RequestParam long groupId) {
        return cat.listQuickDetails(catalog, vehicleId, ssd, groupId);
    }

    // Временный endpoint для отладки - получение сырого XML
    @GetMapping("/{catalog}/quick/details-xml")
    public String quickDetailsXml(@PathVariable String catalog,
                                  @RequestParam String vehicleId,
                                  @RequestParam String ssd,
                                  @RequestParam long groupId) {
        return cat.listQuickDetailsRaw(catalog, vehicleId, ssd, groupId);
    }

    @PostMapping("/{catalog}/op/{operation}")
    public String execOp(@PathVariable String catalog,
                         @PathVariable String operation,
                         @RequestParam(required = false) String ssd,
                         @RequestBody(required = false) Map<String,String> fields) {
        return cat.execCustomOperationRaw(catalog, ssd, operation, fields == null ? Map.of() : fields);
    }
    @GetMapping("/search-by-text")
    public List<DetailDto> search(@RequestParam String query,
                                  @RequestParam(required = false) String catalog) {
        return cat.searchDetails(query, catalog);
    }

    @GetMapping("/search-by-oem")
    public List<DetailDto> searchByOem(@RequestParam("oem") @NotBlank String oem,
                                       @RequestParam(required = false) String catalog,
                                       @RequestParam(value = "locale", required = false) String overrideLocale) {
        return cat.searchDetailsByOem(oem, catalog, overrideLocale);
    }
    @GetMapping("/{catalog}/tree")
    public List<CategoryNodeDto> tree(@PathVariable String catalog,
                                      @RequestParam String vehicleId,
                                      @RequestParam String ssd) {
        return cat.tree(catalog, vehicleId, ssd);
    }
    

    // ---- RAW XML DEBUG ENDPOINTS ----
    
    @GetMapping("/debug/catalogs-raw")
    public String catalogsRaw() {
        return cat.listCatalogsRaw();
    }
    
    @GetMapping("/debug/catalog-info-raw/{catalog}")
    public String catalogInfoRaw(@PathVariable String catalog) {
        return cat.getCatalogInfoRaw(catalog);
    }
    
    @GetMapping("/debug/wizard-start-raw/{catalog}")
    public String wizardStartRaw(@PathVariable String catalog) {
        return cat.wizardStartRaw(catalog);
    }
    
    @PostMapping("/debug/wizard-next-raw/{catalog}")
    public String wizardNextRaw(@PathVariable String catalog,
                               @RequestParam String ssd,
                               @RequestBody Map<String,String> selections) {
        return cat.wizardNextRaw(catalog, ssd, selections);
    }
    
    @PostMapping("/debug/wizard-next-simple/{catalog}")
    public String wizardNextSimple(@PathVariable String catalog,
                                  @RequestBody Map<String,String> request) {
        String key = request.get("key");
        String ssd = request.getOrDefault("ssd", "");
        Map<String,String> selections = Map.of("key", key);
        return cat.wizardNextRaw(catalog, ssd, selections);
    }
    
    @PostMapping("/debug/wizard-finish-raw/{catalog}")
    public String wizardFinishRaw(@PathVariable String catalog,
                                 @RequestParam String ssd,
                                 @RequestBody Map<String,String> selections) {
        return cat.wizardFinishRaw(catalog, ssd, selections);
    }
    @GetMapping("/raw/find-by-number")
    public String findByNumberRaw(@RequestParam String oem,
                                  @RequestParam(required=false) String catalog,
                                  @RequestParam(required=false) String key,  // OEM/Number/DetailNumber/PartNumber
                                  @RequestParam(required=false) String brand) {

        String k = (key == null || key.isBlank()) ? "OEM" : key;
        String cmd = "FindDetailByNumber:Locale=ru_RU"
                + (catalog != null && !catalog.isBlank() ? "|Catalog=" + catalog : "")
                + (brand != null && !brand.isBlank() ? "|Brand=" + brand : "")
                + "|" + k + "=" + oem + "|Localized=true";
        return cat.execCustomOperationRaw(
                catalog != null ? catalog : "", null,
                "FindDetailByNumber",
                Map.of(k, oem, "Localized","true")
        );
    }
    
    // ---- Vehicle Models ----
    @GetMapping("/{catalog}/models")
    public List<VehicleModelDto> getVehicleModels(@PathVariable String catalog) {
        return cat.getVehicleModels(catalog);
    }

}
