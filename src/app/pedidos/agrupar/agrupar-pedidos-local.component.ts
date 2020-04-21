import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';

import swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import * as XLSXStyle from 'xlsx-style';
import { saveAs } from 'file-saver';
import { NgxStepperComponent, StepperOptions } from 'ngx-stepper';
import { LocalDataSource } from 'ng2-smart-table';

import { DataService } from '../../services/data.service';
import { Subscription } from 'rxjs/Subscription';

type AOA = any[][];

@Component({
  selector: 'app-agrupar-pedidos-local',
  templateUrl: './agrupar-pedidos-local.component.html',
  styleUrls: ['./agrupar-pedidos-local.component.scss']
})
export class AgruparPedidosLocalComponent implements OnInit, OnDestroy {

  // Properties DataTableExport
  private columnsExport: Object = {
    codProducto:  { title: 'Cod. Producto', editable: false },
    descripcion:  { title: 'Descripcion', editable: false },
    cantPedida:   { title: 'Cant. Pedida', editable: true },
    unidadMedida: { title: 'Unidad de Medida', editable: false },
    cantReal:     { title: 'Cant. Real', editable: false },
    kgReales:     { title: 'Kg. Reales', editable: false },
    kgPedidos:    { title: 'Kg. Pedidos', editable: false },
    promedio:     { title: 'Promedio', editable: false },
    lote:         { title: 'Lote', editable: false },
    operario:     { title: 'Operario', editable: false }
  };
  public settingsTableExport = {
    attr: { class: 'table' },
    actions: false,
    hideSubHeader: true,
    columns: this.columnsExport,
    pager: { display: false }
  };
  public sourceDataTableExport: LocalDataSource;

  // Properties DataTable
  private columns: Object = {
    codProducto:   { title: 'Cod. Producto', editable: false },
    descripcion:   { title: 'Descripcion', editable: false },
    cantPedida:    { title: 'Cant. Pedida', editable: false },
    multiplicador: { title: 'Multiplicador', editable: false },
    stockActual:   { title: 'Stock Actual', editable: false },
    cantAPedir:    { title: 'Cant. a Pedir', editable: true },
    unidadMedida:  { title: 'Unidad de Medida', editable: false },
    kgUnitario:     { title: 'Kg. Unitario', editable: false },
  };
  /* public settingsTable = {
    attr: { class: 'table' },
    actions: { delete: false },
    hideSubHeader: true,
    columns: this.columns,
    edit: { confirmSave: true },
    pager: { display: false }
  }; */
  public sourceDataTable: LocalDataSource;

  // Properties InputFile Pedidos
  public inputFileModel: Array<any> = new Array<any>();
  public inputMaxFiles: number = 40;
  public inputAccept: string = '.xls,.xlsx';
  private internalFileModel: Array<any> = new Array<any>(); // I need for disconetion of model when remove all files
  private internalFileErrors: Array<any> = new Array<any>();
  private fileName = 'PedidoAgrupado.xlsx';
  private empresaSel = '';
  private depositoSel = '';

  // Properties Stepper
  @ViewChild('stepperLocal')
  public steppers: NgxStepperComponent;
  public optionsStepper: StepperOptions = {
    vertical: false,
    linear: true,
    alternative: true,
    mobileStepText: false,
    enableSvgIcon: true,
    labelStep: 'Paso',
    labelOf: 'de'
  };

  // Indices columnas Excel
  private coColProductoId = 0;
  private coColDescripcion = 1;
  private coColCantPedida = 2;
  private coColUnidadMedida = 3;
  private coColKgPedidos = 6;

  // Owner Properties
  public usuario: {
    depositoId: number;
    deposito: string;
    cantFilesLoad: number
  } = {
    depositoId: -1,
    deposito: '',
    cantFilesLoad: -1
  };

  public usuarioLoaded: boolean;
  public subs: Subscription[] = [];

  constructor(private _iconRegistry: MatIconRegistry,
              private _sanitizer: DomSanitizer,
              private dataService: DataService) {
  }

  public ngOnInit(): void {
    this._iconRegistry
      .addSvgIcon('step-done', this._sanitizer.bypassSecurityTrustResourceUrl('assets/icon/done.svg'));
    this._iconRegistry
      .addSvgIcon('step-warning', this._sanitizer.bypassSecurityTrustResourceUrl('assets/icon/warning.svg'));

    this.subs.push( this.dataService.valueDatosUsuario.subscribe( usuario => {
      this.usuarioLoaded = !!usuario;
      if (this.usuarioLoaded) {
        this.usuario.depositoId = usuario.depositoId;
        this.usuario.cantFilesLoad = usuario.cantFilesLoad;
        this.usuario.deposito = usuario.deposito;

        console.log('Usuario Cargado: ', (this.usuario !== null && this.usuario !== undefined));
      }
    }));
  }

  public ngOnDestroy() {
    this.subs.forEach( sub => {
      if ( sub && sub.unsubscribe ) {
        sub.unsubscribe();
      }
    });
    this.subs.slice(0, this.subs.length);
  }

  // metodos para el manejo de datos
  private readMultipleFiles = (files) => {
    let detalle: AOA;

    function readFile(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const bstr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

          /* grab first sheet */
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];

          /* save data */
          const tmp: AOA = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1}));
          const firstCell: string = tmp[0][0];

          /* Cabecera Clasificación */
          let tmpData: AOA = tmp[3];

          if (firstCell.startsWith('Empresa')) {
            tmp.splice(0, tmp.findIndex((row) => row[0] === 'Cod. Producto') + 1);
            tmp.splice(tmp.findIndex((row) => row[0] === undefined));
            tmpData = [ tmpData, ...tmp ];
          }

          resolve(tmpData);
        };
        reader.onerror = (err) => {
          console.error('Fallo al leer el archivo ', file.file.name, ' Error: ', err);
          reject(err);
        };
        reader.readAsBinaryString(file.file);
      });
    }

    const promises = Array.from(files, function(file: any) {
      return readFile(file)
        .then(function(data: AOA) {
          if (detalle) {
            detalle = [...detalle, ...data];
          } else {
            detalle = data;
          }
        });
    });

    return Promise.all(promises)
      .then(function() {
        return detalle;
      });
  }

  private agruparDetalle(detalle: AOA) {
    const detAgrupado: AOA = new Array(detalle.shift());
    detAgrupado[detAgrupado.length] = detalle.shift();

    detalle.forEach((det) => {
      let index = -1;
      let i = 0;

      while ((detAgrupado.length > 0) && (index === -1)
        && (i < detAgrupado.length)) {
        if (detAgrupado[i][this.coColProductoId] === det[this.coColProductoId]) {
          index = i;

          // Si es una cabecera hay que determinar si es la misma clasificacion
          if (det[this.coColProductoId] === 'Clasificacion:' && det[this.coColDescripcion] !== detAgrupado[i][this.coColDescripcion]) {
            index = -1;
            i = i + 1;
          }
        } else {
          i = i + 1;
        }
      }

      if (index !== -1) {
        // Si existe la cabecera no hay que volver a agregarla
        if (det[this.coColProductoId] !== 'Clasificacion:') {
          const cantPedida = parseFloat(detAgrupado[index][this.coColCantPedida]);
          const KgPedidos = parseFloat(detAgrupado[index][this.coColKgPedidos]);

          detAgrupado[index][this.coColCantPedida] = cantPedida + parseFloat(det[this.coColCantPedida]);
          detAgrupado[index][this.coColKgPedidos] = KgPedidos + parseFloat(det[this.coColKgPedidos]);
        }
      } else {
        detAgrupado.push(det);
      }
    });

    console.log(detAgrupado);

    return detAgrupado;
  }

  private setCantidadAPedir(detalle: AOA) {
    const detalleModif: AOA = [];
    const coColMultiplicador = 3;
    const coColStockActual = 4;
    const coColCantAPedir = 5;
    const coColUnidadMedida = 6;
    const coColKgUnitario = 7;

    for (let i = 0; i < detalle.length; i++) {
      const det = [];

      // Si es Cabecera
      if (detalle[i][0].toString().startsWith('Clasificacion')) {
        detalleModif.push(detalle[i]);
      } else {
        det[this.coColProductoId] = detalle[i][this.coColProductoId];
        det[this.coColDescripcion] = detalle[i][this.coColDescripcion];
        det[this.coColCantPedida] = parseFloat(detalle[i][this.coColCantPedida]).toFixed(0);
        det[coColMultiplicador] = 1;
        det[coColStockActual] = 0;

        det[coColCantAPedir] = parseFloat(detalle[i][this.coColCantPedida]).toFixed(0);
        det[coColUnidadMedida] = detalle[i][this.coColUnidadMedida];
        det[coColKgUnitario] = (detalle[i][this.coColKgPedidos] / detalle[i][this.coColCantPedida]).toFixed(4);

        detalleModif.push(det);
      }
    }

    return detalleModif;
  }

  private confirmNextStep = (): void => {
    this.readMultipleFiles(this.internalFileModel)
      .then(async (det: AOA) => {
        let detalle = this.agruparDetalle(det);
        detalle = this.setCantidadAPedir(detalle);

        this.setSourceDataTable(detalle);
        this.SetDataTableExport();

        this.steppers.next();
      })
      .catch((err) => {
        console.error('Ocurrio un error inesperado:', err);
      });
  }

  private sumKilogramos(detalle): any[] {
    const detalleSum: any[] = detalle.splice(0, 1);
    detalleSum.push({
      codProducto:  'Cod. Producto',
      descripcion:  'Descripcion',
      cantPedida:   'Cant. Pedida',
      unidadMedida: 'Un. de Medida',
      cantReal:     'Cant. Real',
      kgReales:     'Kg. Reales',
      kgPedidos:    'Kg. Pedidos',
      promedio:     'Promedio',
      lote:         'Lote',
      operario:     'Operario'
    });

    let totalKg = 0;
    let subtotalKg = 0;
    let cantItems = 0;

    detalle.forEach((det) => {
      if (det.codProducto === 'Clasificacion:') {
        detalleSum.push({
          codProducto:   'Cant. Items: ' + cantItems,
          descripcion:   undefined,
          cantPedida:    undefined,
          unidadMedida:  undefined,
          cantReal:      undefined,
          kgReales:      undefined,
          kgPedidos:     subtotalKg,
          promedio:      undefined,
          lote:          undefined,
          operario:      undefined
        });

        detalleSum.push(det);
        detalleSum.push({
          codProducto:  'Cod. Producto',
          descripcion:  'Descripcion',
          cantPedida:   'Cant. Pedida',
          unidadMedida: 'Un. de Medida',
          cantReal:     'Cant. Real',
          kgReales:     'Kg. Reales',
          kgPedidos:    'Kg. Pedidos',
          promedio:     'Promedio',
          lote:         'Lote',
          operario:     'Operario'
        });

        subtotalKg = 0;
        cantItems = 0;
      } else {
        totalKg = totalKg + parseFloat(det.kgPedidos);
        subtotalKg = subtotalKg + parseFloat(det.kgPedidos);
        cantItems = cantItems + 1;

        detalleSum.push(det);
      }
    });

    detalleSum.push({
      codProducto:   'Cant. Items: ' + cantItems,
      descripcion:   undefined,
      cantPedida:    undefined,
      unidadMedida:  undefined,
      cantReal:      undefined,
      kgReales:      undefined,
      kgPedidos:     subtotalKg,
      promedio:      undefined,
      lote:          undefined,
      operario:      undefined
    });

    detalleSum.push({
      codProducto:   undefined,
      descripcion:   undefined,
      cantPedida:    undefined,
      unidadMedida:  undefined,
      cantReal:      undefined,
      kgReales:      undefined,
      kgPedidos:     totalKg,
      promedio:      undefined,
      lote:          undefined,
      operario:      undefined
    });

    return detalleSum;
  }

  private setCabeceraWorkSheet(data: any[]): any[] {

    const cabecera = [
      {
        codProducto: 'Empresa:', descripcion: this.empresaSel,
        cantPedida: '', unidadMedida: '', cantReal: 'Bultos:', kgReales: '', kgPedidos: 'Separó:', promedio: '', lote: '', operario: ''
      },
      {
        codProducto: 'Deposito:', descripcion: this.depositoSel,
        cantPedida: '', unidadMedida: '', cantReal: 'Canastos:', kgReales: '', kgPedidos: 'Pesó:', promedio: '', lote: '', operario: ''
      },
      {
        codProducto: 'Fecha:', descripcion: new Date(),
        cantPedida: '', unidadMedida: '', cantReal: 'Pallets:', kgReales: '', kgPedidos: '', promedio: '', lote: '', operario: ''
      },
      {
        codProducto: 'Clasificacion:', descripcion: 'Varias',
        cantPedida: '', unidadMedida: '', cantReal: '', kgReales: '', kgPedidos: '', promedio: '', lote: '', operario: ''
      },
      {
        codProducto: '', descripcion: '',
        cantPedida: '', unidadMedida: '', cantReal: '', kgReales: '', kgPedidos: '', promedio: '', lote: '', operario: ''
      }
    ];

    data = [ ...cabecera, ...data];
    return data;
  }

  private formatWorkSheet(ws: XLSX.WorkSheet) {
    const range = ws['!ref'];
    const firstCell = range.substr(0, range.indexOf(':'));
    const lastCell = range.substr(range.indexOf(':') + 1);
    const firstChar = firstCell.charAt(0);
    const lastChar = lastCell.charAt(0);
    const firstNumber: number = parseInt(firstCell.substr(1), 10);
    const lastNumber: number = parseInt(lastCell.substr(1), 10);
    const firstNumberCabDet = 6; // Determina donde comienza la Cabecera del Detalle

    let abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    abc = abc.substr(abc.indexOf(firstChar));
    abc = abc.substr(0, abc.indexOf(lastChar) + 1);
    const arrChar = Array.from(abc);

    // IMPORTANT: Not implemented in XLSXStyle
    const wsCols: any[] = [];
    const wsRows: any[] = [];
    wsRows.push({ hpt: 15.75 });
    for (let i = firstNumber; i < lastNumber; i++) {
      wsRows.push({ hpt: 30 });
    }
    ws['!rows'] = wsRows;

    // format data
    arrChar.forEach((column) => {
      let maxChars = 6;

      for (let i = firstNumber; i <= lastNumber; i++) {
        // Si es undefined lo pongo '' (vacio)
        ws[`${column}${i}`].v = (ws[`${column}${i}`].v === undefined ? '' : ws[`${column}${i}`].v);
        // Busco el valor con mas caracteres
        maxChars = (ws[`${column}${i}`].v.length > maxChars ? ws[`${column}${i}`].v.length : maxChars);

        // Datos antes de Cabecera del Detalle
        if (i < firstNumberCabDet) {
          ws[`${column}${i}`].s = {
            font: {sz: 14, bold: true}
          };
        } else {
          // por defecto para todas las celdas
          ws[`${column}${i}`].t = 's';
          ws[`${column}${i}`].s = {font: {sz: 14}};

          // formato para el ultimo registro
          if (i === lastNumber) {
            ws[`${column}${i}`].s.font.bold = true;
          } else {
            ws[`${column}${i}`].s.border = {
              top: {style: 'thin', color: {auto: 1}},
              bottom: {style: 'thin', color: {auto: 1}},
              left: {style: 'thin', color: {auto: 1}},
              right: {style: 'thin', color: {auto: 1}}
            };
          }

          // formato cabecera del detalle
          if (
            (ws[`A${i}`].v.toString().startsWith('Cod. Producto')) ||
            (ws[`A${i}`].v.toString().startsWith('Clasificacion')) ||
            (ws[`A${i}`].v.toString().startsWith('Cant'))
          ) {
            ws[`${column}${i}`].s['fill'] = {
              bgColor: {indexed: 64},
              fgColor: {rgb: '00000000'},
              patternType: 'solid'
            };
            ws[`${column}${i}`].s['font']['color'] = {rgb: 'FFFFFF'};
            ws[`${column}${i}`].s['font']['bold'] = true;

            if (ws[`A${i}`].v.toString().startsWith('Cod. Producto')) {
              ws[`${column}${i}`].s['alignment'] = {horizontal: 'center'};
              ws[`${column}${i}`].s.border = {
                top: {style: 'thin', color: {rgb: 'FFFFFF'}},
                bottom: {style: 'thin', color: {rgb: 'FFFFFF'}},
                left: {style: 'thin', color: (`${column}` === firstChar) ? {auto: 1} : {rgb: 'FFFFFF'}},
                right: {style: 'thin', color: (`${column}` === lastChar) ? {auto: 1} : {rgb: 'FFFFFF'}}
              };
            } else {
              ws[`${column}${i}`].s.border = {
                top: {style: 'thin', color: {rgb: 'FFFFFF'}},
                bottom: {style: 'thin', color: {rgb: 'FFFFFF'}},
              };
            }
          }

          if (!isNaN(ws[`${column}${i}`].v) && column !== firstChar) {
            ws[`${column}${i}`].t = 'n';
            ws[`${column}${i}`].s['numFmt'] = '0.0000';
          }
        }
      }

      // Agrego el ancho columna
      wsCols.push({wch: maxChars + 2});
    });

    ws['!cols'] = wsCols;
  }

  protected exportFile() {
    this.sourceDataTableExport.getAll()
      .then((data) => {
        swal({
          title: 'Esta Seguro?',
          text: 'Desea exportar los datos seleccionados?',
          type: 'question',
          showCancelButton: true,
          confirmButtonText: 'Exportar',
          cancelButtonText: 'Cancelar',
          showLoaderOnConfirm: true,
          preConfirm: () => {
            return new Promise((resolve) => {
              this.steppers.next();

              setTimeout(() => {
                /* generate worksheet */
                data = this.sumKilogramos(data);
                data = this.setCabeceraWorkSheet(data);

                const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });
                this.formatWorkSheet(ws);

                /* generate workbook and add the worksheet */
                const wb: XLSX.WorkBook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Hoja1');

                /* save to file */
                // XLSX.writeFile(wb, this.fileName,  { cellStyles: true });
                const wbout = XLSXStyle.write(wb, { bookType: 'xlsx', bookSST: false, type: 'binary' });

                function s2ab(s) {
                  const buf = new ArrayBuffer(s.length);
                  const view = new Uint8Array(buf);
                  for (let i = 0; i !== s.length; ++i) { view[i] = s.charCodeAt(i) & 0xFF; }
                  return buf;
                }

                /* set file name */
                const optFormatDate = {year: 'numeric', month: '2-digit', day: '2-digit'};
                let strDateFile = new Date().toLocaleDateString('es-AR', optFormatDate);
                strDateFile = strDateFile.replace('/', '.');
                strDateFile = strDateFile.replace('/', '.');

                this.fileName = `Agrupado - ${this.empresaSel} - ${this.depositoSel} - ${strDateFile}.xlsx`;
                saveAs(new Blob([s2ab(wbout)], { type: '' }), this.fileName);

                resolve();
              }, 1000);
            });
          },
          allowOutsideClick: () => !swal.isLoading()
        }).then((result) => {
          if (result.value) {
            swal({
              title: 'Agrupado',
              text: 'Los pedidos se agruparon con exito.',
              type: 'success',
            }).then( async () => {
              await this.dataService.refreshALoBruto(['/agrupar-pedidos-local']);
            });
          }
        });
      });
  }

  // eventos para inputFile pedidos
  public onAcceptPedido(file: any): void {
    console.log('accept pedido');

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      const tmp: AOA = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1}));
      const empresaCell: string = tmp[0][1];
      const depositoCell: string = tmp[1][1];

      if (this.empresaSel === '') {
        this.empresaSel = empresaCell;
        this.depositoSel = depositoCell;
      }

      if ((empresaCell.toUpperCase() !== this.empresaSel.toUpperCase()) ||
          (depositoCell.toUpperCase() !== this.depositoSel.toUpperCase())) {
        this.internalFileErrors.push(file);
      } else {
        this.internalFileModel.push(file);
      }
    };

    reader.readAsBinaryString(file.file);
  }

  public onRemovePedido(file: any): void {
    console.log('remove');
    const indexFileModel = this.internalFileModel.indexOf(file);
    const indexFileError = this.internalFileErrors.indexOf(file);

    if (indexFileModel !== -1) { this.internalFileModel.splice(indexFileModel, 1); }
    if (indexFileError !== -1) { this.internalFileErrors.splice(indexFileError, 1); }

    if (this.internalFileModel.length === 0) {
      this.empresaSel = '';
      this.depositoSel = '';
    }
  }

  public onLimitPedido(): void {
    console.log('limit');
    swal({
      type: 'info',
      title: 'Limite',
      text: `Solo se pueden cargar hasta ${this.inputMaxFiles} archivos!`
    });
  }

  public onRejectPedido(): void {
    console.log('reject');
    swal({
      type: 'warning',
      title: 'Archivo Invalido',
      html: `Solo se pueden cargar archivos con extension <b>${this.inputAccept}</b>!`
    });
  }

  // metodos Stepper
  public previousStepSelFiles(): void {
    this.steppers.back();
  }

  public nextStepReadFiles(): void {
    if (this.internalFileErrors.length > 0) {
      let nameFiles = '<ul>';
      for (let i = 0; i < this.internalFileErrors.length; i++) {
        nameFiles = nameFiles + `<li><b>${this.internalFileErrors[i].file.name}</b></li>`;
      }
      nameFiles = nameFiles + '</ul>';

      swal({
        type: 'error',
        title: 'Archivos invalidos',
        html: `<p>Todos los archivos deben pertenecer al mismo local:<p>
              ${nameFiles}
              Debe quitarlos para poder seguir adelante.`,
      });

      return;
    }

    if (this.internalFileModel.length > 1) {
      this.steppers.clearError();
      this.confirmNextStep();
    } else {
      this.steppers.error('Debe seleccionar al menos 2 pedidos');
    }
  }

  // metodos DataTable
  private setSourceDataTable(detalle: AOA) {
    const keys = Object.keys(this.columns);
    const detDataTable: any[] = [];

    for (let i = 0; i < detalle.length; i++) {
      const row = detalle[i];
      const regTable: any = {};

      for (let j = 0; j < row.length; j++) {
        regTable[keys[j]] = row[j];
      }

      detDataTable.push(regTable);
    }

    this.sourceDataTable = new LocalDataSource(detDataTable);
  }

  private SetDataTableExport() {
    this.sourceDataTable.getAll()
      .then( data => {
        const detDataTable: any[] = [];

        console.log(data);

        data.forEach( det => {
          if (
            (det.cantAPedir > 0) ||
            (det.codProducto.startsWith('Clasificacion')) ||
            (det.codProducto.startsWith('Cant'))
          ) {
            const regTable: any = {};

            // Si es Cabecera o Pie
            if ((det.codProducto.startsWith('Clasificacion')) ||
              (det.codProducto.startsWith('Cant'))) {
              regTable['codProducto'] = det.codProducto;
              regTable['descripcion'] = det.descripcion;
              regTable['cantPedida'] = '';
              regTable['unidadMedida'] = '';
              regTable['kgPedidos'] = (det.codProducto.startsWith('Cant') ? det.unidadMedida : '');
            } else {
              regTable['codProducto'] = det.codProducto;
              regTable['descripcion'] = det.descripcion;
              regTable['cantPedida'] = det.cantAPedir;
              regTable['unidadMedida'] = det.unidadMedida;
              regTable['kgPedidos'] = (det.cantAPedir * det.kgUnitario).toFixed(4);
            }

            regTable['kgReales'] = '';
            regTable['cantReal'] = '';
            regTable['promedio'] = '';
            regTable['lote'] = '';
            regTable['operario'] = '';

            detDataTable.push(regTable);
          }
        });

        console.log(detDataTable);
        this.sourceDataTableExport = new LocalDataSource(detDataTable);
      });
  }

}
